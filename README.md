# sqs-move-with-attrs
Moves all messages including its attributes from one AWS SQS queue to another.<br>
Expected moving performance is 10K messages per minute.

[![Build Status](https://travis-ci.org/vladru/sqs-move-with-attrs.svg?branch=master)](https://travis-ci.org/vladru/sqs-move-with-attrs)
[![Coverage Status](https://coveralls.io/repos/github/vladru/sqs-move-with-attrs/badge.svg?branch=master)](https://coveralls.io/github/vladru/sqs-move-with-attrs?branch=master)

## Prerequisite

- Node.js 8.10 or later
- optionally yarn 1 or later

## Install
### Install as command line utility
```
npm install -g sqs-move-with-attrs
```
or
```.env
yarn global add sqs-move-with-attrs
```
### Install to local directory
Clone project repository from github to the local folder and run
```
yarn install
```
## Configuration

Empty configuration object and Default Credential Provider chain are used to create AWS SQS client.

Define AWS_REGION environment variable to specify region used by AWS SDK.   

## Usage
### if project installed as command line utility
```
sqs-move-with-attrs <sourceSQSUrl> <destinationSQSUrl>
```
### if project installed to local directory
```
yarn move <sourceSQSUrl> <destinationSQSUrl>
```
