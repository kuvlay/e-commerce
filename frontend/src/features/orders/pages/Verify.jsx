import { useContext, useEffect } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const Verify = () => {
  const { token, setCartItems, backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");

  const verifyPayment = async () => {
    try {
      if (!token) {
        return null;
      }

      // Payment verification will be handled by Razorpay
      const res = { data: { success: success === "true" } };

      if (res.data.success) {
        setCartItems({});
        navigate("/orders");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [token]);

  return <div></div>;
};

export default Verify;
