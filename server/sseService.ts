// Minimal placeholder for sseService used in server/trpc routers
export const sseService = {
  send: (_event: string, _payload: unknown) => {
    return Promise.resolve();
  },
};
