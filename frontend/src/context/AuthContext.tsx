'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({user: null, loading: true});

export function AuthProvider({children}: ReactNode) {
	const [user, setUser] = useState<UserInfo | null>(null);
	const [loading, setLoading] = useState(true);

	const refreshUser = useCallback(async () => {
	  setLoading(true);
	  try {
		const res = await fetch('/api/auth/validate', { credentials: 'include' });
		const data = await res.json();
		if (data.valid) setUser(data.user);
		else setUser(null);
	  } catch {
		setUser(null);
	  } finally {
		setLoading(false);
	  }
	}, []);

	
	useEffect(() => { refreshUser(); }, [refreshUser]);

	return (
		<AuthContext.Provider value = {{user, loading, refreshUser}}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
