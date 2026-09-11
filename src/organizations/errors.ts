export class OrganizationAPIError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OrganizationAPIError";
    this.status = status;
  }
}
