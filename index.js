var Package = require("./package.json");

var AWS = require("aws-sdk"),
	mime = require("mime"),
	uuid = require("uuid").v4,
	fs = require("fs"),
	request = require("request"),
	path = require("path"),
	winston = require.main.require("winston"),
	nconf = require.main.require('nconf'),
	gm = require("gm"),
	im = gm.subClass({ imageMagick: true }),
	meta = require.main.require("./src/meta");

var plugin = {}

"use strict";

var S3Conn = null;
var settings = {
	"accessKeyId": process.env.AWS_ACCESS_KEY_ID || false,
	"secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY || false,
	"endpoint": process.env.S3_ENDPOINT || "fra1.digitaloceanspaces.com",
	"region": process.env.S3_ENDPOINT_REGION || "eu-central-1",
	"bucket": process.env.S3_UPLOADS_BUCKET || "",
	"host": process.env.S3_UPLOADS_HOST || "fra1.digitaloceanspaces.com",
	"path": process.env.S3_UPLOADS_PATH || "files/"
};

function fetchSettings(callback) {

	settings.accessKeyId = process.env.AWS_ACCESS_KEY_ID || false;
	settings.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || false;
	settings.bucket = process.env.S3_UPLOADS_BUCKET || "";
	settings.host = process.env.S3_UPLOADS_HOST || "fra1.digitaloceanspaces.com";
	settings.path = process.env.S3_UPLOADS_PATH || "files/";
	settings.endpoint = process.env.S3_ENDPOINT || "fra1.digitaloceanspaces.com";
	settings.region = process.env.S3_ENDPOINT_REGION || "eu-central-1";

	if (settings.accessKeyId && settings.secretAccessKey) {
		AWS.config.update({
			accessKeyId: settings.accessKeyId,
			secretAccessKey: settings.secretAccessKey
		});
	}

	if (settings.region) {
		AWS.config.update({
			region: settings.region
		});
	}

	if (settings.endpoint) {
		AWS.config.update({
			endpoint: settings.endpoint
		});
	}

	if (typeof callback === "function") {
		callback();
	}
}

function S3() {
	if (!S3Conn) {
		S3Conn = new AWS.S3();
	}

	return S3Conn;
}

function makeError(err) {
	if (err instanceof Error) {
		err.message = Package.name + " :: " + err.message;
	} else {
		err = new Error(Package.name + " :: " + err);
	}

	winston.error(err.message);
	return err;
}

plugin.activate = function (data) {
	if (data.id === 'nodebb-plugin-s3-uploads-digitalocean') {
		fetchSettings();
	}

};

plugin.deactivate = function (data) {
	if (data.id === 'nodebb-plugin-s3-uploads-digitalocean') {
		S3Conn = null;
	}
};

plugin.load = function (params, callback) {
	fetchSettings(function (err) {
		if (err) {
			return winston.error(err.message);
		}
		var adminRoute = "/admin/plugins/s3-upload";

		params.router.get(adminRoute, params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
		params.router.get("/api" + adminRoute, params.middleware.applyCSRF, renderAdmin);

		callback();
	});
};

function renderAdmin(req, res) {
	// Regenerate csrf token
	var token = req.csrfToken();

	var forumPath = nconf.get('url');
	if (forumPath.split("").reverse()[0] != "/") {
		forumPath = forumPath + "/";
	}
	var data = {
		bucket: settings.bucket,
		host: settings.host,
		path: settings.path,
		forumPath: forumPath,
		region: settings.region,
		endpoint: settings.endpoint,
		accessKeyId: false || "[hidden]",
		secretAccessKey: false || "[hidden]",
		csrf: token
	};

	res.render("admin/plugins/s3-upload", data);
}


plugin.uploadImage = function (data, callback) {
	var image = data.image;

	if (!image) {
		winston.error("invalid image");
		return callback(new Error("invalid image"));
	}

	//check filesize vs. settings
	if (image.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
		winston.error("error:file-too-big, " + meta.config.maximumFileSize);
		return callback(new Error("[[error:file-too-big, " + meta.config.maximumFileSize + "]]"));
	}

	var type = image.url ? "url" : "file";
	var allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif'];

	if (type === "file") {
		if (!image.path) {
			return callback(new Error("invalid image path"));
		}

		if (allowedMimeTypes.indexOf(mime.getType(image.path)) === -1) {
			return callback(new Error("invalid mime type"));
		}

		fs.readFile(image.path, function (err, buffer) {
			uploadToS3(image.name, err, buffer, callback);
		});
	}
	else {
		if (allowedMimeTypes.indexOf(mime.getType(image.url)) === -1) {
			return callback(new Error("invalid mime type"));
		}
		var filename = image.url.split("/").pop();

		var imageDimension = parseInt(meta.config.profileImageDimension, 10) || 128;

		// Resize image.
		im(request(image.url), filename)
			.resize(imageDimension + "^", imageDimension + "^")
			.stream(function (err, stdout, stderr) {
				if (err) {
					return callback(makeError(err));
				}

				// This is sort of a hack - We"re going to stream the gm output to a buffer and then upload.
				// See https://github.com/aws/aws-sdk-js/issues/94
				var buf = new Buffer(0);
				stdout.on("data", function (d) {
					buf = Buffer.concat([buf, d]);
				});
				stdout.on("end", function () {
					uploadToS3(filename, null, buf, callback);
				});
			});
	}
};

plugin.uploadFile = function (data, callback) {
	var file = data.file;

	if (!file) {
		return callback(new Error("invalid file"));
	}

	if (!file.path) {
		return callback(new Error("invalid file path"));
	}

	//check filesize vs. settings
	if (file.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
		winston.error("error:file-too-big, " + meta.config.maximumFileSize);
		return callback(new Error("[[error:file-too-big, " + meta.config.maximumFileSize + "]]"));
	}

	fs.readFile(file.path, function (err, buffer) {
		uploadToS3(file.name, err, buffer, callback);
	});
};

function uploadToS3(filename, err, buffer, callback) {
	if (err) {
		return callback(makeError(err));
	}

	var s3Path;
	if (settings.path && 0 < settings.path.length) {
		s3Path = settings.path;

		if (!s3Path.match(/\/$/)) {
			// Add trailing slash
			s3Path = s3Path + "/";
		}
	}
	else {
		s3Path = "files/";
	}

	var s3KeyPath = s3Path.replace(/^\//, ""); // S3 Key Path should not start with slash.

	var params = {
		Bucket: settings.bucket,
		ACL: "public-read",
		Key: s3KeyPath + uuid() + path.extname(filename),
		Body: buffer,
		ContentLength: buffer.length,
		ContentType: mime.getType(filename)
	};

	S3().putObject(params, function (err) {
		if (err) {
			return callback(makeError(err));
		}

		host = "https://" + settings.bucket + "." + settings.host; //forming the URL

		callback(null, {
			name: filename,
			url: host + "/" + params.Key
		});
	});
}

var admin = plugin.admin = {};

admin.menu = function (custom_header, callback) {
	custom_header.plugins.push({
		"route": "/plugins/s3-upload",
		"icon": "fa-envelope-o",
		"name": "S3 Upload"
	});

	callback(null, custom_header);
};

module.exports = plugin;