'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
/**
 * @param sqsUrl
 * @returns true if format of string passed as argument match to SQS URL pattern
 */
exports.isSqsUrlFormatValid = (sqsUrl) => {
    const sqsUrlRegex = /^https:\/\/sqs\.[\w-]+\.amazonaws\.com\/[\d]+\/.+$/;
    return sqsUrlRegex.test(sqsUrl);
};
exports.isSqsNameFormatValid = (sqsName) => {
    // look at https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-quotas.html
    const sqsNameReg = /^[\w-]{1,80}$/;
    return sqsNameReg.test(sqsName);
};
exports.getCurrentAwsRegion = () => {
    return aws_sdk_1.default.config.region;
};
exports.getAwsAccountId = async () => {
    const stsClient = new aws_sdk_1.default.STS();
    const resp = await stsClient.getCallerIdentity().promise();
    return resp.Account;
};
//# sourceMappingURL=utils.js.map