-- شاشة دخول الكاشير قد تكون مرتبطة بجلسة Supabase سابقة، لذلك تحتاج قراءة دليل الفروع بدور authenticated أيضًا.
GRANT EXECUTE ON FUNCTION public.get_public_branches(text) TO anon, authenticated;
