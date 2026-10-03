import supabase from "../supabase";

export async function logout(navigate) {
  await supabase.auth.signOut();
  localStorage.removeItem("servio_cashier");
  navigate("/login", { replace: true });
}
