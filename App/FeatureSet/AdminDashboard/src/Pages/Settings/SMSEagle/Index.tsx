import PageMap from "../../../Utils/PageMap";
import RouteMap, { RouteUtil } from "../../../Utils/RouteMap";
import DashboardSideMenu from "../SideMenu";
import Route from "Common/Types/API/Route";
import ObjectID from "Common/Types/ObjectID";
import FormFieldSchemaType from "Common/UI/Components/Forms/Types/FormFieldSchemaType";
import CardModelDetail from "Common/UI/Components/ModelDetail/CardModelDetail";
import Page from "Common/UI/Components/Page/Page";
import FieldType from "Common/UI/Components/Types/FieldType";
import GlobalConfig from "Common/Models/DatabaseModels/GlobalConfig";
import React, { FunctionComponent, ReactElement, useState } from "react";
import Card from "Common/UI/Components/Card/Card";
import MarkdownViewer from "Common/UI/Components/Markdown.tsx/MarkdownViewer";
import BasicForm from "Common/UI/Components/Forms/BasicForm";
import Alert, { AlertType } from "Common/UI/Components/Alerts/Alert";
import { JSONObject } from "Common/Types/JSON";
import HTTPErrorResponse from "Common/Types/API/HTTPErrorResponse";
import HTTPResponse from "Common/Types/API/HTTPResponse";
import URL from "Common/Types/API/URL";
import API from "Common/UI/Utils/API/API";
import { APP_API_URL } from "Common/UI/Config";
import { useTranslation } from "react-i18next";

const smsEagleSetupMarkdown: string = [
  "### What you'll need",
  "- An SMSEagle hardware SMS gateway with APIv2 enabled.",
  "- A valid APIv2 access token generated on your SMSEagle device in Users > Access to API menu.",
  "- Network connectivity between your OneUptime server and the SMSEagle device.",
  "",
  "### 1. Get your SMSEagle API URL",
  "The API URL is the base URL of your SMSEagle device, for example `https://192.168.0.100`.",
  "Make sure the OneUptime server can reach this address over the network.",
  "",
  "### 2. Generate an API access token",
  "1. Log in to your SMSEagle web panel.",
  "2. Go to **Users** and select the user account you want to use for API access.",
  '3. In the Access to API menu, find the **API access token** section and generate a new token (or copy an existing one). Make sure the token has permissions for **SMS**, **Ring Call**, and **TTS Advanced Call**.',
  "4. Paste the token into the **Access Token** field below.",
  "",
  "### 3. Test",
  "Use the test cards below to verify that SMS, Ring Calls, and TTS Advanced Calls work correctly.",
].join("\n");

const SettingsSMSEagle: FunctionComponent = (): ReactElement => {
  const { t } = useTranslation();
  const [isSendingTestSms, setIsSendingTestSms] = useState<boolean>(false);
  const [testSmsError, setTestSmsError] = useState<string>("");
  const [testSmsSuccess, setTestSmsSuccess] = useState<string>("");

  const [isSendingTestRing, setIsSendingTestRing] = useState<boolean>(false);
  const [testRingError, setTestRingError] = useState<string>("");
  const [testRingSuccess, setTestRingSuccess] = useState<string>("");

  const [isSendingTestTts, setIsSendingTestTts] = useState<boolean>(false);
  const [testTtsError, setTestTtsError] = useState<string>("");
  const [testTtsSuccess, setTestTtsSuccess] = useState<string>("");

  return (
    <Page
      title={t("pages.settings.title")}
      breadcrumbLinks={[
        {
          title: t("breadcrumbs.adminDashboard"),
          to: RouteUtil.populateRouteParams(RouteMap[PageMap.HOME] as Route),
        },
        {
          title: t("breadcrumbs.settings"),
          to: RouteUtil.populateRouteParams(
            RouteMap[PageMap.SETTINGS] as Route,
          ),
        },
        {
          title: t("breadcrumbs.smseagle"),
          to: RouteUtil.populateRouteParams(
            RouteMap[PageMap.SETTINGS_SMSEAGLE] as Route,
          ),
        },
      ]}
      sideMenu={<DashboardSideMenu />}
    >
      <Card
        title={t("pages.settings.smseagle.setupCardTitle")}
        description={t("pages.settings.smseagle.setupCardDescription")}
      >
        <MarkdownViewer text={smsEagleSetupMarkdown} />
      </Card>

      <CardModelDetail
        name="SMSEagle Settings"
        cardProps={{
          title: t("pages.settings.smseagle.configCardTitle"),
          description: t("pages.settings.smseagle.configCardDescription"),
        }}
        isEditable={true}
        editButtonText={t("pages.settings.smseagle.configEditButton")}
        formFields={[
          {
            field: {
              smsEagleApiUrl: true,
            },
            title: "API URL",
            fieldType: FormFieldSchemaType.Text,
            required: true,
            description:
              "Base URL of your SMSEagle device (e.g. https://192.168.0.100).",
            placeholder: "https://192.168.0.100",
            validation: {
              minLength: 7,
              maxLength: 500,
            },
          },
          {
            field: {
              smsEagleAccessToken: true,
            },
            title: "Access Token",
            fieldType: FormFieldSchemaType.EncryptedText,
            required: true,
            description:
              "APIv2 access token generated on your SMSEagle device.",
            placeholder: "your-api-v2-access-token",
            validation: {
              minLength: 1,
              maxLength: 500,
            },
          },
        ]}
        modelDetailProps={{
          modelType: GlobalConfig,
          id: "model-detail-global-config-smseagle",
          fields: [
            {
              field: {
                smsEagleApiUrl: true,
              },
              title: "API URL",
              fieldType: FieldType.Text,
              placeholder: t("common.notConfigured"),
            },
            {
              field: {
                smsEagleAccessToken: true,
              },
              title: "Access Token",
              fieldType: FieldType.HiddenText,
              placeholder: t("common.notConfigured"),
            },
          ],
          modelId: ObjectID.getZeroObjectID(),
        }}
      />

      {/* Test SMS */}
      <Card
        title={t("pages.settings.smseagle.testSmsCardTitle")}
        description={t("pages.settings.smseagle.testSmsCardDescription")}
      >
        {testSmsSuccess ? (
          <Alert
            type={AlertType.SUCCESS}
            title={testSmsSuccess}
            className="mb-4"
          />
        ) : (
          <></>
        )}

        <BasicForm
          id="send-test-smseagle-sms-form"
          name="Send test SMS"
          isLoading={isSendingTestSms}
          error={testSmsError || ""}
          submitButtonText={t("pages.settings.smseagle.testSmsSubmitButton")}
          maxPrimaryButtonWidth={true}
          initialValues={{
            toPhone: "",
          }}
          fields={[
            {
              field: {
                toPhone: true,
              },
              title: "Recipient Phone Number",
              description:
                "Phone number to send the test SMS to (with country code, e.g. +48123456789).",
              placeholder: "+48123456789",
              required: true,
              fieldType: FormFieldSchemaType.Phone,
            },
          ]}
          onSubmit={async (
            values: JSONObject,
            onSubmitSuccessful?: () => void,
          ) => {
            const toPhone: string = String(values["toPhone"] || "").trim();

            if (!toPhone) {
              setTestSmsSuccess("");
              setTestSmsError(
                t("pages.settings.smseagle.testMissingPhone"),
              );
              return;
            }

            setIsSendingTestSms(true);
            setTestSmsError("");
            setTestSmsSuccess("");

            try {
              const response: HTTPResponse<JSONObject> | HTTPErrorResponse =
                await API.post({
                  url: URL.fromString(APP_API_URL.toString()).addRoute(
                    "/notification/smseagle/test-sms",
                  ),
                  data: {
                    toPhone,
                  },
                });

              if (response instanceof HTTPErrorResponse) {
                throw response;
              }

              if (response.isFailure()) {
                throw new Error(
                  t("pages.settings.smseagle.testSmsFailure"),
                );
              }

              setTestSmsSuccess(
                t("pages.settings.smseagle.testSmsSuccess"),
              );

              if (onSubmitSuccessful) {
                onSubmitSuccessful();
              }
            } catch (err) {
              setTestSmsError(API.getFriendlyMessage(err));
            } finally {
              setIsSendingTestSms(false);
            }
          }}
        />
      </Card>

      {/* Test RING */}
      <Card
        title={t("pages.settings.smseagle.testRingCardTitle")}
        description={t("pages.settings.smseagle.testRingCardDescription")}
      >
        {testRingSuccess ? (
          <Alert
            type={AlertType.SUCCESS}
            title={testRingSuccess}
            className="mb-4"
          />
        ) : (
          <></>
        )}

        <BasicForm
          id="send-test-smseagle-ring-form"
          name="Send Test RING Call"
          isLoading={isSendingTestRing}
          error={testRingError || ""}
          submitButtonText={t("pages.settings.smseagle.testRingSubmitButton")}
          maxPrimaryButtonWidth={true}
          initialValues={{
            toPhone: "",
          }}
          fields={[
            {
              field: {
                toPhone: true,
              },
              title: "Recipient Phone Number",
              description:
                "Phone number to ring (with country code, e.g. +48123456789).",
              placeholder: "+48123456789",
              required: true,
              fieldType: FormFieldSchemaType.Phone,
            },
          ]}
          onSubmit={async (
            values: JSONObject,
            onSubmitSuccessful?: () => void,
          ) => {
            const toPhone: string = String(values["toPhone"] || "").trim();

            if (!toPhone) {
              setTestRingSuccess("");
              setTestRingError(
                t("pages.settings.smseagle.testMissingPhone"),
              );
              return;
            }

            setIsSendingTestRing(true);
            setTestRingError("");
            setTestRingSuccess("");

            try {
              const response: HTTPResponse<JSONObject> | HTTPErrorResponse =
                await API.post({
                  url: URL.fromString(APP_API_URL.toString()).addRoute(
                    "/notification/smseagle/test-ring",
                  ),
                  data: {
                    toPhone,
                  },
                });

              if (response instanceof HTTPErrorResponse) {
                throw response;
              }

              if (response.isFailure()) {
                throw new Error(
                  t("pages.settings.smseagle.testRingFailure"),
                );
              }

              setTestRingSuccess(
                t("pages.settings.smseagle.testRingSuccess"),
              );

              if (onSubmitSuccessful) {
                onSubmitSuccessful();
              }
            } catch (err) {
              setTestRingError(API.getFriendlyMessage(err));
            } finally {
              setIsSendingTestRing(false);
            }
          }}
        />
      </Card>

      {/* Test TTS */}
      <Card
        title={t("pages.settings.smseagle.testTtsCardTitle")}
        description={t("pages.settings.smseagle.testTtsCardDescription")}
      >
        {testTtsSuccess ? (
          <Alert
            type={AlertType.SUCCESS}
            title={testTtsSuccess}
            className="mb-4"
          />
        ) : (
          <></>
        )}

        <BasicForm
          id="send-test-smseagle-tts-form"
          name="Send test TTS Advanced call"
          isLoading={isSendingTestTts}
          error={testTtsError || ""}
          submitButtonText={t("pages.settings.smseagle.testTtsSubmitButton")}
          maxPrimaryButtonWidth={true}
          initialValues={{
            toPhone: "",
          }}
          fields={[
            {
              field: {
                toPhone: true,
              },
              title: "Recipient Phone Number",
              description:
                "Phone number to call with TTS (with country code, e.g. +48123456789).",
              placeholder: "+48123456789",
              required: true,
              fieldType: FormFieldSchemaType.Phone,
            },
          ]}
          onSubmit={async (
            values: JSONObject,
            onSubmitSuccessful?: () => void,
          ) => {
            const toPhone: string = String(values["toPhone"] || "").trim();

            if (!toPhone) {
              setTestTtsSuccess("");
              setTestTtsError(
                t("pages.settings.smseagle.testMissingPhone"),
              );
              return;
            }

            setIsSendingTestTts(true);
            setTestTtsError("");
            setTestTtsSuccess("");

            try {
              const response: HTTPResponse<JSONObject> | HTTPErrorResponse =
                await API.post({
                  url: URL.fromString(APP_API_URL.toString()).addRoute(
                    "/notification/smseagle/test-tts-advanced",
                  ),
                  data: {
                    toPhone,
                  },
                });

              if (response instanceof HTTPErrorResponse) {
                throw response;
              }

              if (response.isFailure()) {
                throw new Error(
                  t("pages.settings.smseagle.testTtsFailure"),
                );
              }

              setTestTtsSuccess(
                t("pages.settings.smseagle.testTtsSuccess"),
              );

              if (onSubmitSuccessful) {
                onSubmitSuccessful();
              }
            } catch (err) {
              setTestTtsError(API.getFriendlyMessage(err));
            } finally {
              setIsSendingTestTts(false);
            }
          }}
        />
      </Card>
    </Page>
  );
};

export default SettingsSMSEagle;
