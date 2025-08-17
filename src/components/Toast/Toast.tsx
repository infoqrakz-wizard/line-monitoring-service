import { Dialog } from "@mantine/core";

export default function Toast({
  opened,
  close,
  children,
}: {
  opened: boolean;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      opened={opened}
      withCloseButton
      onClose={close}
      size="lg"
      radius="md"
    >
      {children}
    </Dialog>
  );
}
