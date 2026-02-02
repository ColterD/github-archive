"use client";
import AuthHook from "@/hooks/AuthHooks";
import ModaL from "./modal";
import IconButton from "../IconButton";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {FaEye, FaEyeSlash } from "react-icons/fa";
import { DiApple } from "react-icons/di";
import { FcGoogle } from "react-icons/fc";
import Cookies from "js-cookie";
import register from "@/actions/register";
import { HiOutlineMail } from "react-icons/hi";
import { HiOutlineLockClosed } from "react-icons/hi";
import { HiOutlineLockOpen } from "react-icons/hi";
import { FormControl, FormErrorMessage } from '@chakra-ui/react'
import Login from "@/actions/login";
import forgetPassword from "@/actions/forget";
import NewPass from "@/actions/newPassword";
import { FaMeta } from "react-icons/fa6";
import Endata from "@/EnData.json";
import Frdata from "@/FrData.json";
import { useGlobalState } from "@/app/Providers";

enum AUTHSTEPS {
  LOGIN = 1,
  REGESTER = 2,
  FORGETPASSWORD = 3,
}

export type UsersCreateInput = {
  id?: string;
  email: string;
  lastName?: string;
  firstName?: string;
  gender?: string;
  avatar?: string;
  password?: string;
  is_active?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
};

export default function AuthenticationModal() {
  const {globalLang, reload, setReload} = useGlobalState();
  const data = globalLang === 'En' ? Endata : Frdata;
  const [IsLoading, setLoading] = React.useState<boolean>(true);
  
  const [emailInput, setemailInput] = React.useState("");
  const [fnameInput, setfnameInput] = React.useState("");
  const [lnameInput, setlnameInput] = React.useState("");
  const [passwordInput, setpasswordInput] = React.useState("");
  const [showPassword, setshowPassword] = React.useState(false);
  const [Gender, setGender] = useState("");
  
  const [validatecode, setvalidatecode] = React.useState("");
  const [IsMounted, setMounted] = React.useState<boolean>(false);
  
  const [MailTouched, setMailTouched] = useState(false);
  const [PassTouched, setPassTouched] = useState(false);
  const [firstTouched, setfirstTouched] = useState(false);
  const [lastTouched, setlastTouched] = useState(false);
  const [genderTouched, setgenderTouched] = useState(false);
  const [validatTouched, setvalidatTouched] = useState(false);
  const [WrongInput, setWrongInput] = useState(false);
  
  const [signin, setsignin] = useState(true);
  const [GoToNext, setGoToNext] = useState(false);
  const [forgetPass, setforgetPass] = useState(false);
  const [newPass, setnewPass] = useState(false);
  const [validatePass, setvalidatePass] = useState(false);
  
  const [prePass, setprePass] = useState<number>(0);
  
  const router = useRouter();
  
  React.useEffect(() => {
    setLoading(false);
    setMounted(true);
  }, []);
  const authHook = AuthHook();

  const setInit = () => {
    setMailTouched(false);
    setPassTouched(false);
    setfirstTouched(false);
    setlastTouched(false);
    setgenderTouched(false);
    setvalidatTouched(false);
    setshowPassword(false);
    setWrongInput(false);
    setsignin(false);
    setGoToNext(false);
    setforgetPass(false);
    setnewPass(false);
    setvalidatePass(false);
    setLoading(false);
    setfnameInput("");
    setlnameInput("");
    setpasswordInput("");
    setGender("");
    setvalidatecode("");
  }

  const setInitSignup = () => {
    setMailTouched(false);
    setPassTouched(false);
    setfirstTouched(false);
    setlastTouched(false);
    setgenderTouched(false);
    setvalidatTouched(false);
    setshowPassword(false);
    setWrongInput(false);
    setsignin(false);
    setGoToNext(false);
    setforgetPass(false);
    setnewPass(false);
    setvalidatePass(false);
    setLoading(false);
    setfnameInput("");
    setlnameInput("");
    setGender("");
    setvalidatecode("");
  }

  const setTouchAll = () => {
    setMailTouched(true);
    setPassTouched(true);
    setfirstTouched(true);
    setlastTouched(true);
    setgenderTouched(true);
    setvalidatTouched(true);
  }

  const isValidEmail = (email: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const OnSubmitLogin = async () => {
    setTouchAll();
    if (emailInput && passwordInput) {
      setLoading(true);
      const Pyload: any | null = await Login(emailInput, passwordInput);
      if (Pyload.status == 401) {
        setWrongInput(true);
        setLoading(false);
        return;
      }
      setInit();
      Cookies.set("token", Pyload.token, { expires: 7 });
      setReload(!reload);
      authHook.onClose();
      router.push("/");
    }
  };

  const onForgetSubmit = async () => {
    setTouchAll();
    if (emailInput) {
      setLoading(true);
      const Pyload: any | null = await forgetPassword(emailInput);
      if (!Pyload) {
        setInit();
        setWrongInput(true);
        return;
      }
      setprePass(Pyload);
      setInit();
      setvalidatePass(true);
    }
  }; 

  const onValidateSubmit = () => {
    setTouchAll();
    if (validatecode && validatecode.length == 6 && /^[0-9]+$/.test(validatecode)) {
      if (parseInt(validatecode) == prePass) {
        setInit();
        setnewPass(true);
      } else {
        setWrongInput(true);
      }
    }
  }

  const onNewPassSubmit = async () => {
    setTouchAll();
    if (passwordInput && passwordInput.length >= 6) {
      setLoading(true);
      const Pyload: any | null = await NewPass(emailInput, passwordInput);
      if (!Pyload) {
        setLoading(false);
        return;
      }
      setInit();
      setsignin(true);
    }
  }

  const OnPreSubmit = () => {
    setTouchAll();
    if (emailInput && isValidEmail(emailInput) && passwordInput.length >= 6) {
      setInitSignup();
      setGoToNext(true);
    }
  }

  const OnSubmit = async () => {
    setTouchAll();
    if (emailInput && lnameInput && Gender) {
      const registerData: UsersCreateInput = {
        email: emailInput,
        password: passwordInput,
        lastName: lnameInput,
        firstName: fnameInput,
        gender: Gender,
      };
      setLoading(true);
      const Pyload: any | null = await register(registerData);
      if (!Pyload) {
        setLoading(false);
        return;
      }
      setInit();
      setsignin(true);
      Cookies.set("token", Pyload.token, { expires: 7 });
      setReload(!reload);
      authHook.onClose();
      router.push("/");
    }
  };

  const signIn = (
    <div className="w-full flex flex-col justify-center items-center">
      <div className="Authentication  max-w-lg px-12">
        <div className="pb-12 text-[45px] font-semibold">
          <h1>{data.auth.signintitle}</h1>
        </div>
        <div className="w-full  flex flex-col gap-4">
          <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9] cursor-pointer"
          onClick={() => {router.push(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`)}}>
            <div className=" text-4xl p-3 flex justify-end items-center"><FcGoogle/></div>
            <div className=" text-xl text-[#282121] font-medium flex justify-center items-center"><h2>{data.auth.Googlesignin}</h2></div>
          </div>
          <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9] cursor-pointer"
           onClick={() => {router.push(`${process.env.NEXT_PUBLIC_API_URL}/auth/meta/callback`)}}>
            <div className=" text-4xl p-3 flex justify-end items-center text-black"><FaMeta/></div>
            <div className=" text-xl text-[#282121] font-medium flex justify-center items-center"><h2>{data.auth.Metasignin}</h2></div>
          </div>
          <div className="flex gap-4 justify-center items-center py-4">
          <hr className="w-40 h-[6px] bg-gray-200 rounded-md" />
            <span className=" text-xl font-semibold">{data.auth.or}</span>
          <hr className="w-40 h-[6px] bg-gray-200 rounded-md" />
          </div>
          <FormControl isRequired isInvalid={MailTouched && (!emailInput || !isValidEmail(emailInput))}>
          <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
            <div className=" text-4xl p-3 flex justify-end items-center text-[#535353]">
            <HiOutlineMail/>
            </div>
              <div className="w-full rounded-3xl">
              <input
                disabled={IsLoading}
                onFocus={() => { setMailTouched(true) }}
                onKeyDown={(event) => event.key === "Enter" && null}
                className=" placeholder:text-[#535353] placeholder:text-xl placeholder:font-medium w-full py-4 px-4 border-none text-[#282121] text-xl outline-none focus-within:ring-0 rounded-r-3xl bg-transparent focus:bg-transparent"
                onChange={(event) => {
                  setemailInput(event.target.value);
                }}
                value={emailInput}
                placeholder={data.auth.email}
                type="email"
                name=""
                id="email"
              />
              </div>
          </div>
              <FormErrorMessage className=' text-red-500 px-6 pt-2 text-sm'>{data.auth.required}</FormErrorMessage>
            </FormControl>
          <FormControl isRequired isInvalid={PassTouched && (!passwordInput.length || WrongInput)}>
            <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
              <div className=" text-4xl p-3 flex justify-end items-center text-[#535353]">
              {showPassword ? <HiOutlineLockOpen/> : <HiOutlineLockClosed/>}
              </div>
              <div className="w-full rounded-3xl">
              <input
                // ref={passwordInputRef}
                disabled={IsLoading}
                onFocus={() => { setPassTouched(true); setWrongInput(false)}}
                onKeyDown={(event) => event.key === "Enter" && null}
                className="border-none placeholder:text-[#535353]  placeholder:text-xl placeholder:font-medium w-full py-4 px-4 bg-transparent text-[#282121] text-xl focus-within:ring-0 rounded-r-3xl focus:bg-transparent"
                onChange={(event) => {
                  setpasswordInput(event.target.value);
                }}
                value={passwordInput}
                placeholder={data.auth.password}
                type={`${!showPassword ? "password" : "text"}`}
                name=""
                id="password"
              />
              </div>
              <div className=" text-4xl flex justify-start items-center text-[#535353] w-1/5">
                <IconButton
                  size={24}
                  OnClick={() => {
                    setshowPassword((prev) => !prev);
                  }}
                  icon={!showPassword ? FaEyeSlash : FaEye}
                />
              </div>

            </div>
            <FormErrorMessage className=' text-red-500 px-6 pt-2 text-sm'>{!passwordInput.length ? data.auth.required : data.auth.wronginput}</FormErrorMessage>
            </FormControl>
          <div className="w-full flex flex-col justify-center items-center">
            <button 
            className="bg-[#ffffff20] backdrop-blur-2xl h-2/3 rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#ffffff20] p-4 w-3/5 font-semibold"
            disabled={IsLoading}
            type="submit"
            onClick={OnSubmitLogin}>{IsLoading ? data.auth.loading : data.auth.login}</button>
          <button className="pt-2 text-[#BCA5A5] cursor-pointer" onClick={() => {setforgetPass(true); setsignin(false)}}>{data.auth.forgot}</button>
          <h3 className="pt-2">{data.auth.needaccount}<button className="text-[#BCA5A5] cursor-pointer" onClick={() => {setsignin(false)}}>{data.auth.signuptitle}</button></h3>
          </div>
        </div>
      </div>
    </div>
  );

  const forget = (
    <div className="relative w-full h-full">
      <div className="w-full flex flex-col justify-center items-center">
        <div className="Authentication  max-w-lg px-12">
        <div className="pb-12 text-[30px] font-semibold">
          <h1>{data.auth.forgottitle}</h1>
        </div>
          <div className="w-full  flex flex-col gap-4">
            <FormControl isRequired isInvalid={MailTouched && (!emailInput || !isValidEmail(emailInput) || WrongInput)}>
            <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
              <div className=" text-4xl p-3 flex justify-end items-center text-[#535353]">
              <HiOutlineMail/>
              </div>
                <div className="w-full rounded-3xl">
                <input
                  // ref={emailInputRef}
                  disabled={IsLoading}
                  onFocus={() => { setMailTouched(true) }}
                  onKeyDown={(event) => event.key === "Enter" && null}
                  className=" placeholder:text-[#535353] placeholder:text-xl placeholder:font-medium w-full py-4 px-4 border-none text-[#282121] text-xl outline-none focus-within:ring-0 rounded-r-3xl bg-transparent focus:bg-transparent"
                  onChange={(event) => {
                    setemailInput(event.target.value);
                  }}
                  value={emailInput}
                  placeholder={data.auth.email}
                  type="email"
                  name=""
                  id="email"
                />
                </div>
            </div>
                <FormErrorMessage className=' text-red-500 px-6 pt-2 text-sm'>{WrongInput ? 'Wrong mail, please enter valid mail' : 'Required'}</FormErrorMessage>
              </FormControl>
            <div className="w-full flex flex-col justify-center items-center py-6">
              <button 
              className="bg-[#ffffff20] backdrop-blur-2xl h-2/3 rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#ffffff20] p-4 w-3/5  text-xl font-semibold"
              disabled={IsLoading}
              type="submit"
              onClick={onForgetSubmit}>
                {IsLoading ? data.auth.loading : data.auth.next }</button>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
              <button 
              className="bg-[#ffffff20] backdrop-blur-2xl h-2/3 rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#ffffff20] p-4 w-3/5  text-xl font-semibold"
              disabled={IsLoading}
              type="submit"
              onClick={() => {setInit(); setsignin(true); setemailInput('')}}>
                {data.auth.goback }</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  
  const validate = (
    <div className="relative w-full h-full">
      <div className="w-full flex flex-col justify-center items-center">
        <div className="Authentication  max-w-lg px-12">
        <div className="pb-12 text-[30px] font-semibold">
          <h1 className="text-center">{data.auth.digitTitle}</h1>
        </div>
          <div className="w-full  flex flex-col gap-4">
          <FormControl isRequired isInvalid={validatTouched && (!validatecode || validatecode.length != 6 || !/^[0-9]+$/.test(validatecode) || WrongInput)}>
          <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
            <div className="w-full rounded-3xl">
            <input
              // ref={emailInputRef}
              disabled={IsLoading}
              onFocus={() => { setTouchAll(); setWrongInput(false)}}
              onKeyDown={(event) => event.key === "Enter" && null}
              className=" placeholder:text-[#535353] placeholder:text-xl placeholder:font-medium w-full py-4 px-4 border-none text-[#282121] text-xl outline-none focus-within:ring-0 rounded-r-3xl bg-transparent focus:bg-transparent"
              onChange={(event) => {
                setvalidatecode(event.target.value);
              }}
              value={validatecode}
              placeholder={data.auth.digitholder }
              type="text"
              name=""
              id="digitcode"
            />
            </div>
          </div>
              <FormErrorMessage className=' text-red-500 px-6 pt-2 text-sm'>{!validatecode ? data.auth.required : WrongInput ? data.auth.digitwrong : data.auth.enterdigit }</FormErrorMessage>
            </FormControl>
            <div className="w-full flex flex-col justify-center items-center py-6">
              <button 
              className="bg-[#ffffff20] backdrop-blur-2xl h-2/3 rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#ffffff20] p-4 w-3/5  text-xl font-semibold"
              disabled={IsLoading}
              type="submit"
              onClick={onValidateSubmit}>
                {data.auth.validate}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  
  const NewPassword = (
    <div className="relative w-full h-full">
      <div className="w-full flex flex-col justify-center items-center">
        <div className="Authentication  max-w-lg px-12">
        <div className="pb-12 text-[30px] font-semibold">
          <h1>{data.auth.newpassword}</h1>
        </div>
          <div className="w-full  flex flex-col gap-4">
          <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
            <div className=" text-4xl p-3 flex justify-end items-center text-[#535353]">
            {showPassword ? <HiOutlineLockOpen/> : <HiOutlineLockClosed/>}
            </div>
            <div className="w-full rounded-3xl">
            <input
              disabled={IsLoading}
              onFocus={() => { setPassTouched(true) }}
              onKeyDown={(event) => event.key === "Enter" && null}
              className="border-none placeholder:text-[#535353]  placeholder:text-xl placeholder:font-medium w-full py-4 px-4 bg-transparent text-[#282121] text-xl focus-within:ring-0 rounded-r-3xl focus:bg-transparent"
              onChange={(event) => {
                setpasswordInput(event.target.value);
              }}
              value={passwordInput}
              placeholder={data.auth.password}
              type={`${!showPassword ? "password" : "text"}`}
              name=""
              id="password"
            />
            </div>
            <div className=" text-4xl flex justify-start items-center text-[#535353] w-1/5">
              <IconButton
                size={24}
                OnClick={() => {
                  setshowPassword((prev) => !prev);
                }}
                icon={!showPassword ? FaEyeSlash : FaEye}
              />
            </div>

          </div>
          { PassTouched && <div className="w-full flex flex-col text-sm pl-4">
            <p>{data.auth.passwordrule }</p>
              <li className={`pl-4 ${passwordInput.length >= 6 ? 'text-[#12A332]' : 'text-[#C82A2A]'}`}>{data.auth.passwordlist }</li>
          </div>}
            <div className="w-full flex flex-col justify-center items-center py-6">
              <button 
              className="bg-[#ffffff20] backdrop-blur-2xl h-2/3 rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#ffffff20] p-4 w-3/5  text-xl font-semibold"
              disabled={IsLoading}
              type="submit"
              onClick={onNewPassSubmit}>
                {IsLoading ? data.auth.loading : data.auth.changepass }</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    )

  const signUp2 = (
    <div className="relative w-full h-full">
      <div className="w-full flex flex-col justify-center items-center">
        <div className="Authentication  max-w-lg px-12">
          <div className="w-full  flex flex-col gap-4">
          <FormControl isRequired isInvalid={firstTouched && !fnameInput}>
            <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
              <div className="w-full rounded-3xl">
                <input
                // ref={fnameInputRef}
                disabled={IsLoading}
                onKeyDown={(event) => event.key === "Enter" && null}
                onFocus={() => { setfirstTouched(true) }}
                className=" placeholder:text-[#535353] placeholder:text-xl placeholder:font-medium w-full py-4 px-4 border-none text-[#282121] text-xl outline-none focus-within:ring-0 rounded-3xl bg-transparent focus:bg-transparent"
                onChange={(event) => {
                  setfnameInput(event.target.value);
                }}
                value={fnameInput}
                placeholder={data.auth.firstname }
                type="text"
                name=""
                id="fname"
              />
              </div>
            </div>
            <FormErrorMessage className=' text-red-500 px-6 pt-2 text-sm'>{data.auth.required }</FormErrorMessage>
          </FormControl>
          <FormControl isRequired isInvalid={lastTouched && !lnameInput}>
            <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
              <div className="w-full rounded-3xl">
              <input
                // ref={lnameInputRef}
                disabled={IsLoading}
                onFocus={() => { setlastTouched(true) }}
                onKeyDown={(event) => event.key === "Enter" && null}
                className=" placeholder:text-[#535353] placeholder:text-xl placeholder:font-medium w-full py-4 px-4 border-none text-[#282121] text-xl outline-none focus-within:ring-0 rounded-3xl bg-transparent focus:bg-transparent"
                onChange={(event) => {
                  setlnameInput(event.target.value);
                }}
                value={lnameInput}
                placeholder={data.auth.lastname }
                type="text"
                name=""
                id="lname"
              />
              </div>
            </div>
            <FormErrorMessage className=' text-red-500 px-6 pt-2 text-sm'>{data.auth.required }</FormErrorMessage>
          </FormControl>
          <FormControl isRequired isInvalid={genderTouched && !Gender}>
            <select
            onChange={(e) => {setGender(e.target.value)}}
            value={Gender}
            onFocus={() => { setgenderTouched(true) }}
            className="form-select w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9] text-[#535353] text-xl font-medium p-4 focus-within:ring-0 border-none">
              <option value="">{data.auth.gender }</option>
              <option value="male">{data.auth.male }</option>
              <option value="female">{data.auth.female }</option>
            </select>
            <FormErrorMessage className=' text-red-500 px-6 pt-2 text-sm'>{data.auth.required }</FormErrorMessage>
          </FormControl>
            <div className="w-full flex flex-col justify-center items-center py-6">
              <button 
              className="bg-[#ffffff20] backdrop-blur-2xl h-2/3 rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#ffffff20] p-4 w-3/5 font-semibold"
              disabled={IsLoading}
              type="submit"
              onClick={OnSubmit}>
                {IsLoading ? data.auth.loading : data.auth.signuptitle }</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  const signUp1 = (
    <div className="w-full flex flex-col justify-center items-center">
      <div className="Authentication  max-w-lg px-12">
        <div className="pb-12 text-[45px] font-semibold">
          <h1>{data.auth.signuptitle }</h1>
        </div>
        <div className="w-full  flex flex-col gap-4">
          <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9] cursor-pointer"
          onClick={() => {router.push(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`)}}>
            <div className=" text-4xl p-3 flex justify-end items-center"><FcGoogle/></div>
            <div className=" text-xl text-[#282121] font-medium flex justify-center items-center"><h2>{data.auth.googlesignup }</h2></div>
          </div>
          <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9] cursor-pointer"
           onClick={() => {}}>
            <div className=" text-4xl p-3 flex justify-end items-center text-black"><FaMeta/></div>
            <div className=" text-xl text-[#282121] font-medium flex justify-center items-center"><h2>{data.auth.metasignup }</h2></div>
          </div>
          <div className="flex gap-4 justify-center items-center py-4">
          <hr className="w-40 h-[6px] bg-gray-200 rounded-md" />
            <span className=" text-xl font-semibold">{data.auth.or }</span>
          <hr className="w-40 h-[6px] bg-gray-200 rounded-md" />
          </div>
          <FormControl isRequired isInvalid={MailTouched && (!emailInput || !isValidEmail(emailInput))}>
          <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
            <div className=" text-4xl p-3 flex justify-end items-center text-[#535353]">
            <HiOutlineMail/>
            </div>
              <div className="w-full rounded-3xl">
              <input
                disabled={IsLoading}
                onFocus={() => { setMailTouched(true) }}
                onKeyDown={(event) => event.key === "Enter" && null}
                className=" placeholder:text-[#535353] placeholder:text-xl placeholder:font-medium w-full py-4 px-4 border-none text-[#282121] text-xl outline-none focus-within:ring-0 rounded-r-3xl bg-transparent focus:bg-transparent"
                onChange={(event) => {
                  setemailInput(event.target.value);
                }}
                value={emailInput}
                placeholder={`Email`}
                type="email"
                name=""
                id="email"
              />
              </div>
          </div>
              <FormErrorMessage className=' text-red-500 px-6 pt-2 text-sm'>{data.auth.required }</FormErrorMessage>
            </FormControl>
          <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
            <div className=" text-4xl p-3 flex justify-end items-center text-[#535353]">
            {showPassword ? <HiOutlineLockOpen/> : <HiOutlineLockClosed/>}
            </div>
            <div className="w-full rounded-3xl">
            <input
              // ref={passwordInputRef}
              disabled={IsLoading}
              onFocus={() => { setPassTouched(true) }}
              onKeyDown={(event) => event.key === "Enter" && null}
              className="border-none placeholder:text-[#535353]  placeholder:text-xl placeholder:font-medium w-full py-4 px-4 bg-transparent text-[#282121] text-xl focus-within:ring-0 rounded-r-3xl focus:bg-transparent"
              onChange={(event) => {
                setpasswordInput(event.target.value);
              }}
              value={passwordInput}
              placeholder={data.auth.password }
              type={`${!showPassword ? "password" : "text"}`}
              name=""
              id="password"
            />
            </div>
            <div className=" text-4xl flex justify-start items-center text-[#535353] w-1/5">
              <IconButton
                size={24}
                OnClick={() => {
                  setshowPassword((prev) => !prev);
                }}
                icon={!showPassword ? FaEyeSlash : FaEye}
              />
            </div>

          </div>
          { PassTouched && <div className="w-full flex flex-col text-sm pl-4">
            <p>{data.auth.passwordrule }</p>
              <li className={`pl-4 ${passwordInput.length >= 6 ? 'text-[#12A332]' : 'text-[#C82A2A]'}`}>{data.auth.passwordlist }</li>
          </div>}
          <div className="w-full flex flex-col justify-center items-center">
            <button 
            className="bg-[#ffffff20] backdrop-blur-2xl h-2/3 rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#ffffff20] p-4 w-3/5 font-semibold"
            disabled={IsLoading}
            type="submit"
            onClick={OnPreSubmit}>{data.auth.continue }</button>
          <h3 className="pt-2">{data.auth.already }<button className="text-[#BCA5A5]" onClick={() => {setsignin(true)}}>{data.auth.login }</button> </h3>
          </div>
        </div>
      </div>
    </div>
  );
  if (!IsMounted) return;
  return (
    <ModaL
      body={signin ? signIn : forgetPass ? forget : validatePass ? validate : newPass ? NewPassword : GoToNext ? signUp2 : signUp1}
      OnClose={() => {authHook.onClose(); setInit(); setsignin(true)}}
      heading={"Authentication"}
      IsOpen={authHook.IsOpen}
    />
  );
}
