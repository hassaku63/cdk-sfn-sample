import pathlib
from jinja2 import Template


here = pathlib.Path(__file__).parent


def handler(event, context):
    template: Template = None
    with open(here / 'template.txt') as f:
        template = Template(f.read())
    
    if not Template:
        raise Exception('valid template not found')

    result = template.render(
        name='My Title',
        function_name=context.function_name,
        function_version=context.function_version,
        aws_request_id=context.aws_request_id,
        log_group_name=context.log_group_name,
        log_stream_name=context.log_stream_name,
    )

    print('result')
    print(result)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html'
        },
        'body': result
    }
