# sqs-move-with-attrs
Moves all messages including its attributes from one AWS SQS queue to another.
Expected moving performance is 10K messages per minute.

## Prerequisite

- Node.js 8.10 or later
- yarn 1 or later

## Install
Clone this repo and run
```
yarn install
```
## Configuration

Empty configuration object and Default Credential Provider chain are used to create AWS SQS client.

Define AWS_REGION environment variable to specify region used by AWS SDK.   

## Usage
In directory of project run
```
yarn move <sourceSQSUrl> <destinationSQSUrl>
```
