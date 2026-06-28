'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserInfo {
	id: string;
	email: string;
	role: string;
	first_name: string;
	middle_name?: string;
	last_name: string;
}

interface AuthContextType {
	user: UserInfo | null;
	loading: boolean;
}

const AuthContext = createContext<AuthContextType>({user: null, loading: true});

export function AuthProvider({children}: ReactNode) {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [loading, setLoading] = useState(true);
	
	useEffect(() => {
		fetch('/api/auth/validate', { credentials: 'include' })
		.then(res => res.json())
		.then(data => {
			if (data.valid) setUser(data.user);
			else setUser(null);
		})
		.catch(() => setUser(null))
		.finally(() => setLoading(false));
	}, []);

	return (
		<AuthContext.Provider value = {{user, loading}}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
