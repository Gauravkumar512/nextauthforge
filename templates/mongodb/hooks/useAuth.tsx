'use client'
import axios from "axios"
import React, { createContext, useContext,useEffect } from "react"

const AuthContext = createContext<any>(null)

export const AuthProvider = ({children}: {children: React.ReactNode})=>{

    const [user,Setuser] = React.useState(null)
    const [loading,Setloading] = React.useState(true)

    const fetchUser = async ()=>{
        try {
            const response = await axios.get('/api/auth/me')
            Setuser(response.data.user)
        } catch (error) {
            Setuser(null)
        } finally {
            Setloading(false)
        }
    }

    useEffect(()=>{
        fetchUser()
    },[])

return (
    <AuthContext.Provider value={{
        user,Setuser,fetchUser,loading
    }}>
        {children}
    </AuthContext.Provider>
)
}

export const useAuth = () => useContext(AuthContext)
