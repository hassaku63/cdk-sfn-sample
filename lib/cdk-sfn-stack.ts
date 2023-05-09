import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as stepfunctions from "aws-cdk-lib/aws-stepfunctions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class CdkSfnStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    // const helloFunction = new lambda.Function(this, "HelloFunction", {
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   functionName: `${this.stackName}-hello`,
    //   handler: "hello.handler",
    //   code: lambda.Code.fromAsset("lambda"),
    // });

    const firstFunction = new NodejsFunction(this, "FirstFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      functionName: `${this.stackName}-first`,
      handler: "handler",
      entry: "handlers/first.ts",
    });

    const secondFunction = new NodejsFunction(this, "SecondFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      functionName: `${this.stackName}-second`,
      handler: "handler",
      entry: "handlers/second.ts",
    });

    const definition = new stepfunctions.Pass(this, 'AppendContext', {
      parameters: {
        data: {
          name: stepfunctions.JsonPath.stringAt('$.name')
        },
        context: stepfunctions.JsonPath.stringAt('$$'),
      }
    })
    .next(new LambdaInvoke(this, "First", {
      lambdaFunction: firstFunction,
      // inputPath: stepfunctions.JsonPath.stringAt('$.input'),
      // resultSelector: {
      //   data: stepfunctions.JsonPath.stringAt('$.Payload')
      // },
      resultPath: stepfunctions.JsonPath.stringAt('$.data'),
    }))
    .next(new LambdaInvoke(this, "Second", {
      lambdaFunction: secondFunction,
      // inputPath: stepfunctions.JsonPath.stringAt('$.output'),  // 前段の output を取る
      // resultSelector: {
      //   data: stepfunctions.JsonPath.stringAt('$.Payload')
      // },
      resultPath: stepfunctions.JsonPath.stringAt('$.data'),
    }))
    .next(new stepfunctions.Pass(this, "IntrinsicFunction1", {
      parameters: {
        input: stepfunctions.JsonPath.stringAt('$.input'),
        context: stepfunctions.JsonPath.stringAt('$.conext'),
        sha256: stepfunctions.JsonPath.hash('$.input.sha512', 'SHA-512')
      },
      // Pass ステートにおいて Intrinsic Function は Parameters でのみ使用可能なので以下の実装は動かない
      // 参考: https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-intrinsic-functions.html#amazon-states-language-intrinsic-functions-states
      // result: stepfunctions.Result.fromString(stepfunctions.JsonPath.stringAt('$.sha256')),
      // resultPath: stepfunctions.JsonPath.stringAt('$.data'),
    }))
    // .next(new stepfunctions.Pass(this, "IntrinsicFunction2", {
    //   parameters: {
    //     sha256: stepfunctions.JsonPath.hash(stepfunctions.JsonPath.stringAt('$.message'), 'SHA-512')
    //   },
    //   resultPath: stepfunctions.JsonPath.stringAt('$.sha256_2'),
    //   outputPath: stepfunctions.JsonPath.stringAt('$.sha256'),
    // }));

    const stateMachine = new stepfunctions.StateMachine(this, "StateMachine", {
      stateMachineName: `${this.stackName}-state-machine`,
      definition: definition,
    });

    const pythonFunction1 = new lambda.Function(this, "PythonFunction1", {
      code: lambda.Code.fromAsset("python-handlers", {
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            "bash", "-c", [
              'pip install -r requirements.txt -t /asset-output',
              'cp -au . /asset-output',
            ].join(" && ")
          ],
        }
      }),
      handler: "handler.handler",
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    const pythonFunction2 = new lambda.DockerImageFunction(this, "PythonFunction2", {
      code: lambda.DockerImageCode.fromImageAsset("python-handlers"),
    });

    this.createMapStateMachine(this, 'MapStateMachine');
  }

  /**
   * Map を持つステートマシンの作成
   * @param scope 
   * @param id 
   * @returns 
   */
  public createMapStateMachine(scope: Construct, id: string) {
    const arr = Array.from({ length: 100 }, (_, i) => i.toString());

    const func1 = new lambda.Function(scope, "Func1", {
      code: new lambda.InlineCode(`
import random

def handler(event, context):
  result = []
  for i in range(random.randint(30, 100)):
    result.append({'attr1': i})
  random.shuffle(result)
  return result
`
      ),
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: "index.handler",
    });

    const mapFunc1 = new lambda.Function(scope, "MapFunc1", {
      code: new lambda.InlineCode(`
def handler(event, context):
  print(event)
  result = event.copy()
  result['attr2'] = event['attr1'] * 10
  return result
`
      ),
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: "index.handler",
    });

    // StateMachine
    const initTask = new LambdaInvoke(scope, 'Init', {
      lambdaFunction: func1,
      payloadResponseOnly: true,
    });

    const map = new stepfunctions.Map(scope, 'Map', {
      // inputPath: stepfunctions.JsonPath.stringAt('$.input'),
      // itemsPath: stepfunctions.JsonPath.stringAt('$.input'),
      // parameters: {
      //   input: stepfunctions.JsonPath.stringAt('$.input'),
      // },
      maxConcurrency: 10,
    });
    map.iterator(new LambdaInvoke(scope, 'MapState1', {
      lambdaFunction: mapFunc1,
      payloadResponseOnly: true,
    }));

    const definition = initTask
      .next(map)

    return new stepfunctions.StateMachine(scope, id, {
      definition: definition,
    });
  }
}
