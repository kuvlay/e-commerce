import express from "express";
import {
  addProduct,
  listProduct,
  removeProduct,
  singleProduct,
  getFeaturedProducts,
  getFeaturedProductsWithPriority,
  toggleFeatured,
  setFeaturedPriority,
  validateCustomCategories,
  getProductMeasurementConfig,
} from "../controllers/productController.js";
import upload from "../../../core/middleware/multer.js";
import adminAuth from "../../auth/middleware/adminAuth.js";

const productRouter = express.Router();

productRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct
);
productRouter.post("/single", singleProduct);
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.get("/list", listProduct);
productRouter.get("/featured", getFeaturedProducts);
productRouter.get("/featured-with-priority", adminAuth, getFeaturedProductsWithPriority);
productRouter.post("/toggle-featured", adminAuth, toggleFeatured);
productRouter.post("/set-featured-priority", adminAuth, setFeaturedPriority);
productRouter.post("/validate-custom-categories", adminAuth, validateCustomCategories);
productRouter.post("/measurement-config", adminAuth, getProductMeasurementConfig);

export default productRouter;
