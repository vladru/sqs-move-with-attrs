# sqs-move-with-attrs
Moves all messages including its attributes from one AWS SQS queue to another.
Expected moving performance is 10K messages per minute.

## Install
yarn install

## Configuration

Empty configuration object and Default Credential Provider chain are used when AWS SQS client is creating.

Define AWS_REGION environment variable to specify region used by AWS SDK.   

## Usage
yarn move <sourceSQSUrl> <destinationSQSUrl>
