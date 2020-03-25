# Custom PopSauce server

Express.JS server for hosting custom PopSauce games.

This server requires you to have an AWS account and that you have an access key to your 
account.

## Setup

1. Create an AWS account

This is pretty straightforward

2. Get an IAM access key to your AWS account

This can be done in the *IAM* section of your AWS Console.

Please keep the access key ID and secret because the server needs them to connect to a S3 
Bucket.

3. Create a S3 Bucket and setup the following rules

Once again, this is pretty straightforward, so do not forget to untick the *"Block Public 
Access"* box.

Because you only want the server to be able to directly write files into your bucket, please 
set the following strategy for your bucket:

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME-HERE/*"
        }
    ]
}
```

This strategy will allow any IP to HTTP GET files in your bucket, so be careful what you put 
into it.

4. Configure the environment variables

This server heavily relies on environment variables, so you should place the following 
variables into a `.env` file at the root of the server.

- `EXPRESS_LISTENING_PORT`: Port on which you want the server to listen for requests 
(default is `4242`)
- `AWS_REGION_CODE`: Region code in which to use AWS *(examples: eu-west-2, us-east-1, ...)*
- `AWS_S3_BUCKET_NAME`: AWS S3 Bucket name where to store the data retrieved by the server
- `AWS_ACCESS_KEY_ID`: ID of the access key that the server should use to access your S3 
Bucket
- `AWS_SECRET_ACCESS_KEY`: Secret of the access key to required to access the S3 Bucket
