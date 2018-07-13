declare const navigator: any;

export async function requestDialog(message: string) {
  return await new Promise<boolean>((resolve, reject) =>
    navigator.notification.confirm(
      message,
      buttonIndex => resolve(buttonIndex === 1),
      '',
      ['ALLOW', 'DENY']
    )
  );
}
