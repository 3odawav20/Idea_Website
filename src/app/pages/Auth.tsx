import { AccountEntry } from "./AccountEntry";

export function Login() { return <AccountEntry audience="customer" mode="login" />; }
export function Register() { return <AccountEntry audience="customer" mode="register" />; }
export function RegisterCustomer() { return <AccountEntry audience="customer" mode="register" />; }
export function RegisterBusiness() { return <AccountEntry audience="business" mode="register" />; }
export function BusinessLogin() { return <AccountEntry audience="business" mode="login" />; }
export function AdminLogin() { return <AccountEntry audience="admin" mode="login" />; }
export function RoleSelect() { return <Login />; }
