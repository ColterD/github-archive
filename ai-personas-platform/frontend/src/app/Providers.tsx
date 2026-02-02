"use client"
import GetUser from '@/actions/getUser';
import React, { createContext, useEffect, useState } from 'react'
import { ReactNode } from 'react';
import Cookies from 'js-cookie';

type ThemeProviderFunctionProps = {
    children: ReactNode;
};

const GlobalStateContext = createContext<any>(null);

export default function Providers({ children }: ThemeProviderFunctionProps) {
    let localLang = 'En';
    if (typeof window !== 'undefined') {
        localLang = sessionStorage.getItem('lang') || 'En';
      }
    const [globalLang, setGlobalLang] = useState<any>(localLang);
    const [user, setUser] = useState<any>(null);
    const [reload, setReload] = useState(false);
    useEffect(() => {
        sessionStorage.setItem('lang', globalLang);
    }
    , [globalLang]);

    useEffect(() => {
        (async () => {
            // get user data useing GetUser function
            const token = Cookies.get('token');
            if (!token) {
                setUser(null);
                return;
            }
            const user = await GetUser(token);
            setUser(user);
        })();
    }, [reload]);

    return (
        <GlobalStateContext.Provider value={{ globalLang,  setGlobalLang, user, reload, setReload }}>
            <div>
                {children}
            </div>
        </GlobalStateContext.Provider>
    );
}

export const useGlobalState = () => React.useContext(GlobalStateContext);