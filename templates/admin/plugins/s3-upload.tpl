<h1>S3 Uploads Configuration for Digital Ocean Spaces</h1>
<hr/>

<p>This plugin is designed to work with Digital Ocean Spaces. You can configure it via environment variables as shown below.</p>

<h3>Variables:</h3>
<pre><code>export AWS_ACCESS_KEY_ID="your space key"
export AWS_SECRET_ACCESS_KEY="your space secret"
export S3_ENDPOINT="your space endpoint"
export S3_ENDPOINT_REGION="space region"
export S3_UPLOADS_BUCKET="your space name"
export S3_UPLOADS_HOST="your space host name"
export S3_UPLOADS_PATH="path to your files in the space"
</code></pre>

<h3>Instructions:</h3>
<p>
<ul>
	<li><strong>AWS_ACCESS_KEY_ID</strong> and <strong>AWS_SECRET_ACCESS_KEY</strong> are space access key and secret generated in the API section in Digital Ocean.</li>
	<li><strong>S3_ENDPOINT</strong> is the file server name in Digital Ocean. Example value: fra1.digitaloceanspaces.com</li>
	<li><strong>S3_ENDPOINT_REGION</strong> is the region of the server i.e. the location of the data center. Value can be taken from <a href="https://docs.digitalocean.com/products/platform/availability-matrix/">this link</a>. Example value: eu-central-1</li>
	<li><strong>S3_UPLOADS_BUCKET</strong> is the name of your Digital Ocean space.</li>
	<li><strong>S3_UPLOADS_HOST</strong> determines the URL to the file. Usually, it should be the same as S3_ENDPOINT.</li>
	<li><strong>S3_UPLOADS_PATH</strong> (optional) is the folder where the files will be stored. Default value: files</li>
</ul>
</p>
<p>File URL is formed as follows: https://S3_UPLOADS_BUCKET.S3_UPLOADS_HOST/S3_UPLOADS_PATH</p>

<div class="alert alert-warning">
	<p>If you need help, create an <a href="https://github.com/zhivkoangelov/nodebb-plugin-s3-uploads-digitalocean/issues/">issue on
		Github</a>.</p>
</div>

<h3>Current plugin configuration:</h3>
<p>
<ul>
  <li><b>Endpoint: </b> {endpoint}</li>
  <li><b>Region: </b> {region}</li>
  <li><b>Bucket: </b> {bucket}</li>
  <li><b>Host: </b> {host}</li>
  <li><b>Path: </b> {path}</li> 
  <li><b>Access Key Id: </b> {accessKeyId}</li>
  <li><b>Secret Access Key: </b> {secretAccessKey}</li>
</ul>
</p>
