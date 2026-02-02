import Tabs from "./tabs.svelte";
import TabsList from "./tabs-list.svelte";
import TabsTrigger from "./tabs-trigger.svelte";
import TabsContent from "./tabs-content.svelte";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  //
  Tabs as Root,
  TabsList as List,
  TabsTrigger as Trigger,
  TabsContent as Content,
};

export type {
  Tabs as TabsProps,
  TabsList as TabsListProps,
  TabsTrigger as TabsTriggerProps,
  TabsContent as TabsContentProps,
} from "./index.js";
