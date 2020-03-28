# sqs-move-with-attrs
Moves all messages including its attributes from one AWS SQS queue to another.<br>
Expected moving performance is 10K messages per minute.

[![Build Status](https://travis-ci.org/vladru/sqs-move-with-attrs.svg?branch=master)](https://travis-ci.org/vladru/sqs-move-with-attrs)
[![Coverage Status](https://coveralls.io/repos/github/vladru/sqs-move-with-attrs/badge.svg?branch=master)](https://coveralls.io/github/vladru/sqs-move-with-attrs?branch=master)

## Prerequisite

- Node.js 8.10 or later
- optionally yarn 1 or later

## Features

- Batch messages processing and concurrent promises fulfillment provide high performance
- Messages are deleting from source queue only if they have been successfully sent to destination queue
- Message attributes are copied over
- CLI tool supports SQS names instead of full URLs

## Install
### Install as Command Line Interface (CLI) tool 
```
npm install -g sqs-move-with-attrs
```
or
```.env
yarn global add sqs-move-with-attrs
```
### Install to local directory
Clone project repository from github to the local folder and run
```.env
yarn install
```
## Configuration

Empty configuration object and Default Credential Provider chain are used in CLI to create AWS SQS client.

AWS credentials and AWS region configuration should be supplied to SDK
either through [shared credentials file](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html) / [shared config file](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html)
either through [environment variables](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html). 

If AWS region not specified in AWS config file please define it via AWS_REGION environment variable.   

## Usage
### if module installed as CLI tool
```
sqs-move-with-attrs <source_SQS_URL_or_name> <destination_SQS_URL_or_name>
```
### if module installed to local directory
```
yarn move <source_SQS_URL_or_name> <destination_SQS_URL_or_name>
```
### Example of using from Node.js/Typescript
Node.js
```js
const {SQS} = require("aws-sdk");
const {SqsMoveWithAttrs} = require("sqs-move-with-attrs");
...
```
Typescript
```typescript
import {SQS} from "aws-sdk"
import {SqsMoveWithAttrs} from "sqs-move-with-attrs";
...
```
common part of script
```typescript
const sqsClient = new SQS({region:'us-east-1'});
const sqsMoveWithAttrs = new SqsMoveWithAttrs(
    sqsClient,
    "https://sqs.us-east-1.amazonaws.com/<accountId>/sqs-name-dlq",
    "https://sqs.us-east-1.amazonaws.com/<accountId>/sqs-name");
(async () => {
    try {
        await sqsMoveWithAttrs.move();
    } catch (err) {
        console.error(err);
        process.exit(-1)
    }
})();
```
