import { Dispatch, useCallback, useContext, useState } from "react";

import {
  FetchResult,
  MutationFunctionOptions,
  useMutation,
} from "@apollo/client";
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import {
  Auth,
  FacebookAuthProvider,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";

import { IUserAuth } from "@/interfaces/user.interface";
import { LoginType, registerSchema, RegisterType } from "../validations/auth";
import { AUTH_SOCIAL_USER, REGISTER_USER } from "@/queries/auth";

import firebaseApp from "../firebase";
import { showErrorToast } from "@/utils/utils";
import { DispatchProps, MonitorContext } from "@/context/MonitorContext";

export const useRegister = (): IUserAuth => {
  const { dispatch } = useContext(MonitorContext);
  const [validationErrors, setValidationErrors] = useState<
    RegisterType | LoginType
  >({
    username: "",
    password: "",
    email: "",
  });
  const router: AppRouterInstance = useRouter();
  const [registerUser, { loading }] = useMutation(REGISTER_USER);

  const onRegisterSubmit = useCallback(
    async (formData: FormData): Promise<void> => {
      try {
        const resultSchema = registerSchema.safeParse(
          Object.fromEntries(formData)
        );
        if (!resultSchema.success) {
          setValidationErrors((prevState) => ({
            ...prevState,
            username:
              resultSchema.error.format().username?._errors[0] ??
              "Invalid username",
            password:
              resultSchema.error.format().password?._errors[0] ??
              "Invalid password",
            email:
              resultSchema.error.format().email?._errors[0] ?? "Invalid email",
          }));
        } else {
          submitUserData(resultSchema.data, registerUser, dispatch, router);
        }
      } catch {
        showErrorToast("Invalid credentials");
      }
    },
    [registerUser, router]
  );

  return {
    loading,
    validationErrors,
    setValidationErrors,
    onRegisterSubmit,
  };
};

export const useSocialRegister = (): IUserAuth => {
  const { dispatch } = useContext(MonitorContext);
  const router: AppRouterInstance = useRouter();
  const [authSocialUser, { loading }] = useMutation(AUTH_SOCIAL_USER);

  const registerWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const auth: Auth = getAuth(firebaseApp);
    auth.useDeviceLanguage();
    const userCredential: UserCredential = await signInWithPopup(
      auth,
      provider
    );

    const nameList = userCredential.user.displayName!.split(" ");
    const data = {
      username: nameList[0],
      email: userCredential.user.email,
      socialId: userCredential.user.uid,
      type: "google",
    };
    submitUserData(data as RegisterType, authSocialUser, dispatch, router);
  };

  const registerWithFacebook = async (): Promise<void> => {
    const provider = new FacebookAuthProvider();
    const auth: Auth = getAuth(firebaseApp);
    auth.useDeviceLanguage();
    const userCredential: UserCredential = await signInWithPopup(
      auth,
      provider
    );

    const nameList = userCredential.user.displayName!.split(" ");
    const data = {
      username:
        nameList[0].length > 4
          ? nameList[0]
          : userCredential.user.email!.split("@")[0],
      email: userCredential.user.email,
      socialId: userCredential.user.uid,
      type: "facebook",
    };
    submitUserData(data as RegisterType, authSocialUser, dispatch, router);
  };

  return {
    loading,
    authWithGoogle: registerWithGoogle,
    authWithFacebook: registerWithFacebook,
  };
};

async function submitUserData(
  data: RegisterType,
  registerUserMethod: (
    options?: MutationFunctionOptions | undefined
  ) => Promise<FetchResult>,
  dispatch: Dispatch<DispatchProps>,
  router: AppRouterInstance
) {
  try {
    const result: FetchResult = await registerUserMethod({
      variables: { user: data },
    });
    if (result && result.data) {
      const { registerUser, authSocialUser } = result.data;
      dispatch({
        type: "dataUpdate",
        payload: {
          user: registerUser ? registerUser.user : authSocialUser.user,
          notifications: registerUser
            ? registerUser.notifications
            : authSocialUser.notifications,
        },
      });
      router.push("/status");
    }
  } catch (error) {
    showErrorToast("Invalid credentials");
  }
}
