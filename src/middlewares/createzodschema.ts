import { ZodRawShape,ZodObject } from "zod";

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