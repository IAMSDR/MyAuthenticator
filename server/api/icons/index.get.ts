import normalIcons from "~/assets/json/icons.json";
import simpleIcons from "~/assets/json/simpleicons.json";
import { IconsQueryObjectSchema } from "~/types";

export default eventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { data, error } = await getValidatedQuery(
    event,
    IconsQueryObjectSchema.safeParse
  );
  if (error) return;
  if (!data.query) return normalIcons.slice(0, 10);
  const iconsList = data.type === "simple" ? simpleIcons : normalIcons;
  const regex = new RegExp(data.query, "i");
  const icons = iconsList.filter((item) => regex.test(item));
  return icons.slice(0, 20);
});
