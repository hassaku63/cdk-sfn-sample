# for Mac M1
FROM --platform=linux/arm64 public.ecr.aws/lambda/python:3.9 AS build-arm64

COPY requirements.txt  .
RUN  pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"
COPY . ${LAMBDA_TASK_ROOT}

CMD [ "handler.handler" ]

# for Lambda Runtime
FROM --platform=linux/amd64 public.ecr.aws/lambda/python:3.9

# Install the function's dependencies using file requirements.txt
# from your project folder.
COPY requirements.txt  .
RUN  pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# Copy function code
# COPY handler.py ${LAMBDA_TASK_ROOT}
# COPY template.txt ${LAMBDA_TASK_ROOT}
COPY . ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "handler.handler" ]