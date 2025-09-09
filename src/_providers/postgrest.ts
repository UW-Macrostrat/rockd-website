import { PostgrestClient } from "@supabase/postgrest-js";
import { postgrestPrefix } from "~/settings";

const postgrest = new PostgrestClient(postgrestPrefix);

export { postgrest };
