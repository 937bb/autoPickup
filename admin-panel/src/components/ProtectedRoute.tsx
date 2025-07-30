import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authAPI } from "../services/api";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		const token = localStorage.getItem("admin_token");

		if (!token) {
			setIsAuthenticated(false);
			setLoading(false);
			return;
		}

		try {
			const response = await authAPI.getCurrentUser();
			if (response.success) {
				setIsAuthenticated(true);
				localStorage.setItem("admin_user", JSON.stringify(response.data));
			} else {
				setIsAuthenticated(false);
				localStorage.removeItem("admin_token");
				localStorage.removeItem("admin_user");
			}
		} catch (error) {
			setIsAuthenticated(false);
			localStorage.removeItem("admin_token");
			localStorage.removeItem("admin_user");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span className="ml-3 text-gray-600">验证身份中...</span>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export default ProtectedRoute;
