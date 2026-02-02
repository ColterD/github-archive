import { create } from "zustand";

interface IAuth {
  IsOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const AuthHook = create<IAuth>((set) => ({
  IsOpen: false,
  onOpen: () => set({ IsOpen: true }),
  onClose: () => set({ IsOpen: false }),
}));

export default AuthHook;
