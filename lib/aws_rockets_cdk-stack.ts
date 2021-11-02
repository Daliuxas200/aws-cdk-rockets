const path = require("path");
import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";

export class AwsRocketsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, id, {
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      pointInTimeRecovery: false,
    });

    console.log("table name: ", table.tableName);
    console.log("table arn: ", table.tableArn);

    const rocketsLambda = new lambda.Function(this, "PushRocketsFunction", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "rockets_lambda.zip")),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grant(rocketsLambda, "dynamodb:PutItem");

    const api = new apigateway.RestApi(this, "rocketsapi", {});
    const postRocketsIntegration = new apigateway.LambdaIntegration(
      rocketsLambda,
      {
        proxy: false,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      }
    );
    api.root.addMethod("POST", postRocketsIntegration);
  }
}
