import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { authAPI } from "../services/api";
import { LoginRequest } from "../types";

const schema = yup.object({
	username: yup.string().required("请输入用户名或邮箱"),
	password: yup.string().min(6, "密码至少6个字符").required("请输入密码"),
});

const Login: React.FC = () => {
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginRequest>({
		resolver: yupResolver(schema),
	});

	const onSubmit = async (data: LoginRequest) => {
		setLoading(true);
		try {
			const response = await authAPI.login(data);
			console.log("登录响应:", response);

			if (response.success && response.data) {
				localStorage.setItem("admin_token", response.data.token);
				localStorage.setItem("admin_user", JSON.stringify(response.data.user));
				toast.success("登录成功！");

				await new Promise((resolve) => setTimeout(resolve, 1000));

				// 导航到仪表板
				navigate("/dashboard");
			} else {
				toast.error(response.message || "登录失败");
			}
		} catch (error: any) {
			console.error("登录错误:", error);
			toast.error(error.response?.data?.message || "登录失败，请检查网络连接");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
						<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
					</div>
					<h2 className="text-3xl font-bold text-gray-900 mb-2">管理后台登录</h2>
					<p className="text-gray-600">请使用您的管理员账户登录</p>
				</div>

				<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">用户名或邮箱</label>
							<input
								type="text"
								{...register("username")}
								className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
									errors.username ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
								}`}
								placeholder="请输入用户名或邮箱地址"
							/>
							{errors.username && (
								<p className="text-red-500 text-sm mt-2 flex items-center">
									<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									{errors.username.message}
								</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">密码</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									{...register("password")}
									className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
										errors.password ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
									}`}
									placeholder="请输入密码"
								/>
								<button
									type="button"
									className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
									) : (
										<EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
									)}
								</button>
							</div>
							{errors.password && (
								<p className="text-red-500 text-sm mt-2 flex items-center">
									<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									{errors.password.message}
								</p>
							)}
						</div>

						<button
							type="submit"
							className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
							disabled={loading}
						>
							{loading ? (
								<div className="flex items-center justify-center">
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
									登录中...
								</div>
							) : (
								<>
									<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
										/>
									</svg>
									登录
								</>
							)}
						</button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-gray-600">
							还没有账户？
							<Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold ml-1 transition-colors">
								立即注册
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
