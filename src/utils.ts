'use strict';

import AWS from "aws-sdk";

/**
 * @param sqsUrl
 * @returns true if format of string passed as argument match to SQS URL pattern
 */
export const isSqsUrlFormatValid = (sqsUrl: string): boolean => {
    const sqsUrlRegex = /^https:\/\/sqs\.[\w-]+\.amazonaws\.com\/[\d]+\/.+$/;
    return sqsUrlRegex.test(sqsUrl)
};

export const isSqsNameFormatValid = (sqsName: string): boolean => {
    // look at https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-quotas.html
    const sqsNameReg = /^[\w-]{1,80}$/;
    return sqsNameReg.test(sqsName)

};

export const getCurrentAwsRegion = (): string | undefined => {
    return AWS.config.region
};

export const getAwsAccountId = async (): Promise<string | undefined> => {
  const stsClient = new AWS.STS();
  const resp = await stsClient.getCallerIdentity().promise();
  return resp.Account
};