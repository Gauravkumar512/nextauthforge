// TODO(Step 5): AuthProvider/useAuth is not mounted anywhere yet; wire it into the layout.
'use client'
import axios from "axios"
import React, { createContext, useContext,useEffect } from "react"

interface AuthUser {
    _id: string
    username: string
    email: string
}

interface AuthContextValue {
    user: AuthUser | null
    Setuser: React.Dispatch<React.SetStateAction<AuthUser | null>>
    fetchUser: () => Promise<void>
    loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({children}: {children: React.ReactNode})=>{

    const [user,Setuser] = React.useState<AuthUser | null>(null)
    const [loading,Setloading] = React.useState(true)

    const fetchUser = async ()=>{
        try {
            const response = await axios.get('/api/auth/me')
            Setuser(response.data.user)
        } catch {
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
