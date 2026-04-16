import { adaptor } from "./common/adaptor";
import { requireString } from "./common/utility";

export const validateGetResultParams = adaptor("param")((params) => {
    const id = requireString(params, "id");
    return { id };
});
