import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { rejectInvalid } from "../modules/http-error.js";
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from "../modules/products.js";
import {
  parseCreateProduct,
  parseProductSearch,
  parseRouteId,
  parseUpdateProduct,
} from "../modules/validation.js";

export const productsRouter = Router();

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = rejectInvalid(parseProductSearch(req.query));
    const products = await listProducts(query);
    res.status(200).json(products);
  }),
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = rejectInvalid(parseRouteId(req.params["id"]));
    const product = await getProduct(id);
    res.status(200).json(product);
  }),
);

productsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = rejectInvalid(parseCreateProduct(req.body));
    const product = await createProduct(input);
    res.status(201).json(product);
  }),
);

productsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = rejectInvalid(parseRouteId(req.params["id"]));
    const input = rejectInvalid(parseUpdateProduct(req.body));
    const product = await updateProduct(id, input);
    res.status(200).json(product);
  }),
);

productsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = rejectInvalid(parseRouteId(req.params["id"]));
    await deleteProduct(id);
    res.status(204).send();
  }),
);
