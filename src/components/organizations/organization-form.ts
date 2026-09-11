import {
  AnchorButton,
  Button,
  ButtonGroup,
  Callout,
  FormGroup,
  InputGroup,
  TextArea,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { CreateOrganizationInput } from "~/organizations";
import {
  createInputFromValues,
  safeExternalURL,
  safeOrganizationColor,
  slugify,
  validateOrganization,
  type OrganizationFormErrors,
  type OrganizationFormValues,
} from "~/organizations";
import styles from "./organizations.module.sass";

const h = hyper.styled(styles);

const initialValues: OrganizationFormValues = {
  name: "",
  slug: "",
  description: "",
  url: "",
  logoURL: "",
  color: "",
};

interface OrganizationFormProps {
  onSubmit(input: CreateOrganizationInput): Promise<void>;
  submitting: boolean;
  submitError?: string | null;
}

function LogoPreview({
  src,
  organizationName,
}: {
  src: string;
  organizationName: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const logoURL = safeExternalURL(src, { httpsOnly: true });
  if (logoURL == null || failed) return null;
  let alt = "Organization logo preview";
  if (organizationName !== "") alt = `${organizationName} logo preview`;
  return h("div.logo-preview", [
    h("span.control-label", "Logo preview"),
    h("img", {
      src: logoURL,
      alt,
      loading: "lazy",
      referrerPolicy: "no-referrer",
      onError: () => setFailed(true),
    }),
  ]);
}

function pickerColor(value: string): string {
  return safeOrganizationColor(value) ?? "#777777";
}

function errorHelper(id: string, error: string | undefined) {
  if (error == null) return null;
  return h("span.field-error", { id }, error);
}

function helperText(id: string, error: string | undefined, fallback: string) {
  let className = undefined;
  let text = fallback;
  if (error != null) {
    className = "field-error";
    text = error;
  }
  return h("span", { id, className }, text);
}

function errorDescription(id: string, error: string | undefined) {
  if (error != null) return id;
  return undefined;
}

function fieldIntent(error: string | undefined) {
  if (error != null) return "danger";
  return "none";
}

export function OrganizationForm({
  onSubmit,
  submitting,
  submitError = null,
}: OrganizationFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<OrganizationFormErrors>({});
  const [slugEdited, setSlugEdited] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const slugRef = useRef<HTMLInputElement | null>(null);
  const urlRef = useRef<HTMLInputElement | null>(null);
  const logoRef = useRef<HTMLInputElement | null>(null);
  const colorRef = useRef<HTMLInputElement | null>(null);

  function setValue(field: keyof OrganizationFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateName(name: string) {
    setValues((current) => {
      const next = { ...current, name };
      if (!slugEdited) next.slug = slugify(name);
      return next;
    });
    setErrors((current) => ({ ...current, name: undefined, slug: undefined }));
  }

  function focusFirstError(nextErrors: OrganizationFormErrors) {
    if (nextErrors.name != null) return nameRef.current?.focus();
    if (nextErrors.slug != null) return slugRef.current?.focus();
    if (nextErrors.url != null) return urlRef.current?.focus();
    if (nextErrors.logoURL != null) return logoRef.current?.focus();
    if (nextErrors.color != null) return colorRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateOrganization(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }
    await onSubmit(createInputFromValues(values));
  }

  let errorCallout = null;
  if (submitError != null) {
    errorCallout = h(
      Callout,
      { intent: "danger", title: "Organization wasn't created", role: "alert" },
      submitError
    );
  }

  let submitLabel = "Create organization";
  if (submitting) submitLabel = "Creating organization…";

  return h(
    "form.organization-form",
    { onSubmit: handleSubmit, noValidate: true },
    [
      errorCallout,
      h(FormGroup, {
        label: "Organization name",
        labelFor: "organization-name",
        labelInfo: "(required)",
        intent: fieldIntent(errors.name),
        helperText: errorHelper("organization-name-error", errors.name),
        children: h(InputGroup, {
          id: "organization-name",
          inputRef: nameRef,
          value: values.name,
          disabled: submitting,
          autoComplete: "organization",
          "aria-invalid": errors.name != null,
          "aria-describedby": errorDescription(
            "organization-name-error",
            errors.name
          ),
          onChange: (event) => updateName(event.currentTarget.value),
        }),
      }),
      h(FormGroup, {
        label: "Slug",
        labelFor: "organization-slug",
        labelInfo: "(required)",
        intent: fieldIntent(errors.slug),
        helperText: helperText(
          "organization-slug-help",
          errors.slug,
          "Used in the organization's web address. It cannot be changed later."
        ),
        children: h(InputGroup, {
          id: "organization-slug",
          inputRef: slugRef,
          value: values.slug,
          disabled: submitting,
          "aria-invalid": errors.slug != null,
          "aria-describedby": "organization-slug-help",
          onChange: (event) => {
            setSlugEdited(true);
            setValue("slug", event.currentTarget.value.toLowerCase());
          },
        }),
      }),
      h(FormGroup, {
        label: "Description",
        labelFor: "organization-description",
        helperText: "Briefly describe the organization and its purpose.",
        children: h(TextArea, {
          id: "organization-description",
          fill: true,
          rows: 5,
          value: values.description,
          disabled: submitting,
          onChange: (event) =>
            setValue("description", event.currentTarget.value),
        }),
      }),
      h("div.form-row", [
        h(FormGroup, {
          className: "form-field",
          label: "Website URL",
          labelFor: "organization-url",
          intent: fieldIntent(errors.url),
          helperText: errorHelper("organization-url-error", errors.url),
          children: h(InputGroup, {
            id: "organization-url",
            inputRef: urlRef,
            type: "url",
            placeholder: "https://example.org",
            value: values.url,
            disabled: submitting,
            "aria-invalid": errors.url != null,
            "aria-describedby": errorDescription(
              "organization-url-error",
              errors.url
            ),
            onChange: (event) => setValue("url", event.currentTarget.value),
          }),
        }),
        h(FormGroup, {
          className: "form-field",
          label: "Brand color",
          labelFor: "organization-color",
          intent: fieldIntent(errors.color),
          helperText: helperText(
            "organization-color-help",
            errors.color,
            "Optional six-digit hex color."
          ),
          children: h("div.color-input", [
            h(InputGroup, {
              id: "organization-color",
              inputRef: colorRef,
              placeholder: "#C5050C",
              value: values.color,
              disabled: submitting,
              "aria-invalid": errors.color != null,
              "aria-describedby": "organization-color-help",
              onChange: (event) => setValue("color", event.currentTarget.value),
            }),
            h(ButtonGroup, { className: "color-actions", minimal: true }, [
              h("input.color-picker", {
                type: "color",
                value: pickerColor(values.color),
                disabled: submitting,
                "aria-label": "Choose brand color",
                title: "Choose brand color",
                onChange: (event: ChangeEvent<HTMLInputElement>) =>
                  setValue("color", event.currentTarget.value),
              }),
              h(Button, {
                type: "button",
                icon: "cross",
                minimal: true,
                disabled: submitting || values.color === "",
                "aria-label": "Clear brand color",
                title: "Clear brand color",
                onClick: () => setValue("color", ""),
              }),
            ]),
          ]),
        }),
      ]),
      h(FormGroup, {
        label: "Logo URL",
        labelFor: "organization-logo-url",
        intent: fieldIntent(errors.logoURL),
        helperText: helperText(
          "organization-logo-url-help",
          errors.logoURL,
          "Use a complete HTTPS URL for a square or landscape image."
        ),
        children: h(InputGroup, {
          id: "organization-logo-url",
          inputRef: logoRef,
          type: "url",
          placeholder: "https://example.org/logo.png",
          value: values.logoURL,
          disabled: submitting,
          "aria-invalid": errors.logoURL != null,
          "aria-describedby": "organization-logo-url-help",
          onChange: (event) => setValue("logoURL", event.currentTarget.value),
        }),
      }),
      h(LogoPreview, {
        src: values.logoURL,
        organizationName: values.name.trim(),
      }),
      h("div.form-actions", [
        h(
          AnchorButton,
          { href: "/organizations", disabled: submitting },
          "Cancel"
        ),
        h(
          Button,
          { type: "submit", intent: "primary", loading: submitting },
          submitLabel
        ),
      ]),
    ]
  );
}
