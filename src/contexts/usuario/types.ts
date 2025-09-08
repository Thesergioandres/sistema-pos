export type Usuario = {
  id: number;
  nombre: string;
  rol: string;
  sucursalId?: number;
};
export type UsuarioContextValue = {
  usuario?: Usuario;
  setUsuario: (u?: Usuario) => void;
};
