import { ZodObject, ZodRawShape } from "zod";

export interface ICreateZodSchema {
  body?: ZodObject<ZodRawShape>;
  params?: ZodObject<ZodRawShape>;
  query?: ZodObject<ZodRawShape>;
}
export const CreateZodSchema = ({
  body,
  params,
  query,
}: ICreateZodSchema): ICreateZodSchema => {
  return {
    body,
    params,
    query,
  };
};

// import {  ZodObject, ZodRawShape } from "zod";

// export interface ICreateZodSchema<
//   BodyShape extends ZodRawShape,
//   ParamShape extends ZodRawShape = {},
//   QueryShape extends ZodRawShape = {},
// > {
//   body?: ZodObject<BodyShape>;
//   params?: ZodObject<ParamShape>;
//   query?: ZodObject<QueryShape>;
// }

// export function CreateZodSchema<
//   BodyShape extends ZodRawShape,
//   ParamShape extends ZodRawShape = {},
//   QueryShape extends ZodRawShape = {},
// >(schema: {
//   body?: ZodObject<BodyShape>;
//   params?: ZodObject<ParamShape>;
//   query?: ZodObject<QueryShape>;
// }): ICreateZodSchema<BodyShape, ParamShape, QueryShape> {
//   return schema;
// }