import supabase from "../supabase";

export async function logout(navigate) {
  await supabase.auth.signOut();
  localStorage.removeItem("tappo_cashier");
  navigate("/login", { replace: true });
}
