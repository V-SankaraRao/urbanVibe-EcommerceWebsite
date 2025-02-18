import CommonForm from "@/components/common/form";
import { useToast } from "@/components/ui/use-toast";
import { loginFormControls } from "@/config";
import { loginUser } from "@/store/auth-slice";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

const initialState = {
  email: "",
  password: "",
};

function AuthLogin() {
  const [formData, setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const { toast } = useToast();

  function onSubmit(event) {
    event.preventDefault();

    dispatch(loginUser(formData)).then((data) => {
      if (data?.payload?.success) {
        toast({
          title: data?.payload?.message,
        });
      } else {
        toast({
          title: data?.payload?.message,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8 px-6 py-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Sign in to your account
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Don't have an account? 
          <Link
            className="font-medium text-primary hover:text-primary-dark transition duration-200 ml-2"
            to="/auth/register"
          >
            Register
          </Link>
        </p>
      </div>
  
      <CommonForm
        formControls={loginFormControls}
        buttonText={"Sign In"}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
      />
      
      {/* Optional: Add a footer with extra info like privacy policy */}
      <div className="text-center text-sm text-gray-400 mt-6">
        <Link to="/privacy-policy" className="hover:text-gray-700">Privacy Policy</Link> | 
        <Link to="/terms-of-service" className="hover:text-gray-700"> Terms of Service</Link>
      </div>
    </div>
  );
  
}

export default AuthLogin;
