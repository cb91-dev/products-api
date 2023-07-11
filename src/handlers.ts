import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { v4 } from "uuid";
import { TableName, schema, headers, HttpError, errorHandler } from "./utils";
const awsDocClient = new  AWS.DynamoDB.DocumentClient();

const fetchProductDetail = async (id: string) => {
    const response = await awsDocClient.get({
    TableName,
    Key: {
      productID: id,
    }
  })
  .promise();

  if (!response.Item) throw new HttpError(404, { error: 'not found'});
  return response.Item;
};


export const getProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id as string;

  try {
    const product = await fetchProductDetail(id);
    return { statusCode: 200, headers, body: JSON.stringify(product)};
  } catch (e) {
    return errorHandler(e);
  }
};

export const getProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
      const response = await awsDocClient.scan({
        TableName,
      }).promise()

      return { statusCode: 200, body: JSON.stringify(response.Items)};
  } catch (e) {
    return errorHandler(e);
  }
};

export const createProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const request = JSON.parse(event.body as string);

    await schema.validate(request, { abortEarly: false });
  
    const product = {
      ...request,
      productID: v4(),
    };

    await awsDocClient.put({
      TableName,
      Item: product,
    })
    .promise();

    return { statusCode: 201, headers, body: JSON.stringify(product) };
  } catch (e) {
    return errorHandler(e);
  }
};

export const updateProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const id = event.pathParameters?.id as string;
      await fetchProductDetail(id);

      const request = JSON.parse(event.body as string);
      await schema.validate(request, { abortEarly: false });

      const product = {
        ...request,
        productID: id,
      }
      await awsDocClient
      .put({
        TableName,
        Item: product,
      })
      .promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(product),
      }
    } catch (e) {
      return errorHandler(e);
    }
};

export const deleteProduct = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;
    await fetchProductDetail(id);

    await awsDocClient.delete({
      TableName,
      Key: {
        productID: id,
      }
    })
    .promise();

    return { statusCode: 204, headers, body: "" };

  } catch (e) {
    return errorHandler(e);
  }
};
