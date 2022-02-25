# nodebb-plugin-s3-uploads-digitalocean

This plugin is inspired by [nodebb-plugin-s3-uploads](https://github.com/earthsenze/nodebb-plugin-s3-uploads) and configured to work with Digital Ocean spaces.

`npm install nodebb-plugin-s3-uploads-digitalocean`

| Plugin Version | Dependency     | Version Requirement     |
| ---------------| -------------- |:-----------------------:|
| 0.1.0          | NodeBB         | >= 1.18.0 |


This plugin for NodeBB takes file uploads and store them on Digital Ocean spaces, uses the `filter:uploadImage` hook in NodeBB. 

## Plugin Configuration

This plugin is designed to work with Digital Ocean Spaces. You can configure it via environment variables as shown below.

### Environment Variables

```
export AWS_ACCESS_KEY_ID="your space key"
export AWS_SECRET_ACCESS_KEY="your space secret"
export S3_ENDPOINT="your space endpoint"
export S3_ENDPOINT_REGION="space region"
export S3_UPLOADS_BUCKET="your space name"
export S3_UPLOADS_HOST="your space host name"
export S3_UPLOADS_PATH="path to your files in the space"
```

### Instructions

* `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are space access key and space secret generated in the API section in Digital Ocean.
* `S3_ENDPOINT` is the file server name in Digital Ocean. Example value: fra1.digitaloceanspaces.com
* `S3_ENDPOINT_REGION` is the region of the server i.e. the location of the data center. Value can be taken from [this link](https://docs.digitalocean.com/products/platform/availability-matrix/). Example value: eu-central-1
* `S3_UPLOADS_BUCKET` is the name of your Digital Ocean space.</li>
* `S3_UPLOADS_HOST` determines the URL to the file. Usually, it should be the same as S3_ENDPOINT.</li>
* `S3_UPLOADS_PATH` (optional) is the folder where the files will be stored. Default value: files</li>

**NOTE:** File URL is formed as follows: **https://S3_UPLOADS_BUCKET.S3_UPLOADS_HOST/S3_UPLOADS_PATH**

## Caveats

* Currently all uploads are stored in S3 keyed by a UUID and file extension, as such, if a user uploads multiple avatars, all versions will still exist in S3. This is a known issue and may require some sort of cron job to scan for old uploads that are no longer referenced in order for those objects to be deleted from S3.

