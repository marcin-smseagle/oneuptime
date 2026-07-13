import { getSMSEagleConfig } from "../Config";
import SMSEagleConfig from "Common/Types/SMSEagle/SMSEagleConfig";
import {
  SMSEagleRecipients,
  SMSEagleSmsMessage,
  SMSEagleRingMessage,
  SMSEagleTtsMessage,
} from "Common/Types/SMSEagle/SMSEagleMessage";
import BadDataException from "Common/Types/Exception/BadDataException";
import ObjectID from "Common/Types/ObjectID";
import Phone from "Common/Types/Phone";
import SmsStatus from "Common/Types/SmsStatus";
import CallStatus from "Common/Types/Call/CallStatus";
import UserNotificationStatus from "Common/Types/UserNotification/UserNotificationStatus";
import SmsLogService from "Common/Server/Services/SmsLogService";
import CallLogService from "Common/Server/Services/CallLogService";
import UserOnCallLogTimelineService from "Common/Server/Services/UserOnCallLogTimelineService";
import ProjectService from "Common/Server/Services/ProjectService";
import logger from "Common/Server/Utils/Logger";
import SmsLog from "Common/Models/DatabaseModels/SmsLog";
import CallLog from "Common/Models/DatabaseModels/CallLog";
import Project from "Common/Models/DatabaseModels/Project";
import API from "Common/Utils/API";
import HTTPErrorResponse from "Common/Types/API/HTTPErrorResponse";
import HTTPResponse from "Common/Types/API/HTTPResponse";
import URL from "Common/Types/API/URL";
import { JSONArray, JSONObject } from "Common/Types/JSON";

const SENSITIVE_MESSAGE_PLACEHOLDER: string =
  "This message is sensitive and is not logged";

interface SMSEagleResponseItem {
  status: string;
  message: string;
  number: string;
  id: number;
}

export default class SMSEagleService {
  // --- SMS: POST /api/v2/messages/sms ---
  public static async sendSms(
    message: SMSEagleSmsMessage,
    options: {
      projectId?: ObjectID | undefined;
      isSensitive?: boolean | undefined;
      userOnCallLogTimelineId?: ObjectID | undefined;
      incidentId?: ObjectID | undefined;
      alertId?: ObjectID | undefined;
      monitorId?: ObjectID | undefined;
      scheduledMaintenanceId?: ObjectID | undefined;
      statusPageId?: ObjectID | undefined;
      statusPageAnnouncementId?: ObjectID | undefined;
      userId?: ObjectID | undefined;
      onCallPolicyId?: ObjectID | undefined;
      onCallPolicyEscalationRuleId?: ObjectID | undefined;
      onCallDutyPolicyExecutionLogTimelineId?: ObjectID | undefined;
      onCallScheduleId?: ObjectID | undefined;
      teamId?: ObjectID | undefined;
    } = {},
  ): Promise<void> {
    let sendError: Error | null = null;
    const smsLog: SmsLog = new SmsLog();

    try {
      SMSEagleService.validateRecipients(message);

      if (!message.body) {
        throw new BadDataException("SMS message body is required");
      }

      const isSensitiveMessage: boolean = Boolean(options.isSensitive);
      const messageSummary: string = isSensitiveMessage
        ? SENSITIVE_MESSAGE_PLACEHOLDER
        : message.body;

      if (message.to && message.to.length > 0) {
        smsLog.toNumber = new Phone(message.to[0]!);
      }

      smsLog.smsText = messageSummary;
      smsLog.smsCostInUSDCents = 0;
      smsLog.status = SmsStatus.Sending;

      if (options.projectId) {
        smsLog.projectId = options.projectId;
      }

      if (options.incidentId) {
        smsLog.incidentId = options.incidentId;
      }

      if (options.alertId) {
        smsLog.alertId = options.alertId;
      }

      if (options.monitorId) {
        smsLog.monitorId = options.monitorId;
      }

      if (options.scheduledMaintenanceId) {
        smsLog.scheduledMaintenanceId = options.scheduledMaintenanceId;
      }

      if (options.statusPageId) {
        smsLog.statusPageId = options.statusPageId;
      }

      if (options.statusPageAnnouncementId) {
        smsLog.statusPageAnnouncementId = options.statusPageAnnouncementId;
      }

      if (options.userId) {
        smsLog.userId = options.userId;
      }

      if (options.teamId) {
        smsLog.teamId = options.teamId;
      }

      if (options.onCallPolicyId) {
        smsLog.onCallDutyPolicyId = options.onCallPolicyId;
      }

      if (options.onCallPolicyEscalationRuleId) {
        smsLog.onCallDutyPolicyEscalationRuleId =
          options.onCallPolicyEscalationRuleId;
      }

      if (options.onCallScheduleId) {
        smsLog.onCallDutyPolicyScheduleId = options.onCallScheduleId;
      }

      if (options.userOnCallLogTimelineId) {
        smsLog.userOnCallLogTimelineId = options.userOnCallLogTimelineId;
      }

      const config: SMSEagleConfig | null = await getSMSEagleConfig();

      if (!config) {
        throw new BadDataException(
          "SMSEagle is not configured. Please set API URL and access token in the Admin Dashboard.",
        );
      }

      if (options.projectId) {
        const project: Project | null = await ProjectService.findOneById({
          id: options.projectId,
          select: {
            enableSmsNotifications: true,
            name: true,
          },
          props: {
            isRoot: true,
          },
        });

        if (!project) {
          smsLog.status = SmsStatus.Error;
          smsLog.statusMessage = `Project ${options.projectId.toString()} not found.`;
          logger.error(smsLog.statusMessage);
          await SmsLogService.create({
            data: smsLog,
            props: { isRoot: true },
          });
          return;
        }

        if (project.enableSmsNotifications === false) {
          smsLog.status = SmsStatus.Error;
          smsLog.statusMessage =
            "SMS notifications are disabled for this project.";
          logger.error(smsLog.statusMessage);
          await SmsLogService.create({
            data: smsLog,
            props: { isRoot: true },
          });
          return;
        }
      }

      const responseItems: SMSEagleResponseItem[] =
        await SMSEagleService.makeApiCall(config, "/api/v2/messages/sms", {
          ...SMSEagleService.recipientsToBody(message),
          text: message.body,
        });

      const firstItem: SMSEagleResponseItem | undefined = responseItems[0];

      if (firstItem && firstItem.status === "queued") {
        smsLog.status = SmsStatus.Sent;
        smsLog.statusMessage = `SMSEagle: ${firstItem.message || "Queued"}. ID: ${String(firstItem.id)}`;
      } else {
        smsLog.status = SmsStatus.Error;
        smsLog.statusMessage = `SMSEagle: ${firstItem?.message || "Unknown error"}`;
      }
    } catch (error: unknown) {
      logger.error("Failed to send SMS via SMSEagle.");
      logger.error(error);
      smsLog.smsCostInUSDCents = 0;
      smsLog.status = SmsStatus.Error;
      const errorMessage: string =
        error instanceof Error && error.message
          ? error.message
          : `${error as string}`;
      smsLog.statusMessage = errorMessage;
      sendError = error instanceof Error ? error : new Error(errorMessage);
    }

    if (options.projectId) {
      await SmsLogService.create({
        data: smsLog,
        props: { isRoot: true },
      });
    }

    if (options.userOnCallLogTimelineId) {
      await UserOnCallLogTimelineService.updateOneById({
        id: options.userOnCallLogTimelineId,
        data: {
          status:
            smsLog.status === SmsStatus.Sent ||
            smsLog.status === SmsStatus.Delivered ||
            smsLog.status === SmsStatus.Success
              ? UserNotificationStatus.Sent
              : UserNotificationStatus.Error,
          statusMessage: smsLog.statusMessage,
        },
        props: { isRoot: true },
      });
    }

    if (sendError) {
      throw sendError;
    }
  }

  // --- RING: POST /api/v2/calls/ring ---
  public static async makeRingCall(
    message: SMSEagleRingMessage,
    options: {
      projectId?: ObjectID | undefined;
      isSensitive?: boolean | undefined;
      userOnCallLogTimelineId?: ObjectID | undefined;
      incidentId?: ObjectID | undefined;
      alertId?: ObjectID | undefined;
      monitorId?: ObjectID | undefined;
      scheduledMaintenanceId?: ObjectID | undefined;
      statusPageId?: ObjectID | undefined;
      statusPageAnnouncementId?: ObjectID | undefined;
      userId?: ObjectID | undefined;
      onCallPolicyId?: ObjectID | undefined;
      onCallPolicyEscalationRuleId?: ObjectID | undefined;
      onCallDutyPolicyExecutionLogTimelineId?: ObjectID | undefined;
      onCallScheduleId?: ObjectID | undefined;
      teamId?: ObjectID | undefined;
    } = {},
  ): Promise<void> {
    let sendError: Error | null = null;
    const callLog: CallLog = new CallLog();

    try {
      SMSEagleService.validateRecipients(message);

      callLog.toNumber =
        message.to && message.to.length > 0
          ? new Phone(message.to[0]!)
          : new Phone("SMSEagle-contacts");
      callLog.fromNumber = new Phone("SMSEagle");
      callLog.callData = JSON.parse(
        JSON.stringify({
          type: "ring",
          duration: message.duration || 10,
        }),
      ) as JSON;
      callLog.callCostInUSDCents = 0;
      callLog.status = CallStatus.Success;

      if (options.projectId) {
        callLog.projectId = options.projectId;
      }

      if (options.incidentId) {
        callLog.incidentId = options.incidentId;
      }

      if (options.alertId) {
        callLog.alertId = options.alertId;
      }

      if (options.monitorId) {
        callLog.monitorId = options.monitorId;
      }

      if (options.scheduledMaintenanceId) {
        callLog.scheduledMaintenanceId = options.scheduledMaintenanceId;
      }

      if (options.statusPageId) {
        callLog.statusPageId = options.statusPageId;
      }

      if (options.statusPageAnnouncementId) {
        callLog.statusPageAnnouncementId = options.statusPageAnnouncementId;
      }

      if (options.userId) {
        callLog.userId = options.userId;
      }

      if (options.teamId) {
        callLog.teamId = options.teamId;
      }

      if (options.onCallPolicyId) {
        callLog.onCallDutyPolicyId = options.onCallPolicyId;
      }

      if (options.onCallPolicyEscalationRuleId) {
        callLog.onCallDutyPolicyEscalationRuleId =
          options.onCallPolicyEscalationRuleId;
      }

      if (options.onCallScheduleId) {
        callLog.onCallDutyPolicyScheduleId = options.onCallScheduleId;
      }

      const config: SMSEagleConfig | null = await getSMSEagleConfig();

      if (!config) {
        throw new BadDataException(
          "SMSEagle is not configured. Please set API URL and access token in the Admin Dashboard.",
        );
      }

      if (options.projectId) {
        const project: Project | null = await ProjectService.findOneById({
          id: options.projectId,
          select: {
            enableCallNotifications: true,
            name: true,
          },
          props: { isRoot: true },
        });

        if (!project) {
          callLog.status = CallStatus.Error;
          callLog.statusMessage = `Project ${options.projectId.toString()} not found.`;
          logger.error(callLog.statusMessage);
          await CallLogService.create({
            data: callLog,
            props: { isRoot: true },
          });
          return;
        }

        if (project.enableCallNotifications === false) {
          callLog.status = CallStatus.Error;
          callLog.statusMessage =
            "Call notifications are disabled for this project.";
          logger.error(callLog.statusMessage);
          await CallLogService.create({
            data: callLog,
            props: { isRoot: true },
          });
          return;
        }
      }

      const responseItems: SMSEagleResponseItem[] =
        await SMSEagleService.makeApiCall(config, "/api/v2/calls/ring", {
          ...SMSEagleService.recipientsToBody(message),
          duration: message.duration || 10,
        });

      const firstItem: SMSEagleResponseItem | undefined = responseItems[0];

      if (firstItem && firstItem.status === "queued") {
        callLog.status = CallStatus.Success;
        callLog.statusMessage = `SMSEagle RING: ${firstItem.message || "Queued"}. ID: ${String(firstItem.id)}`;
      } else {
        callLog.status = CallStatus.Error;
        callLog.statusMessage = `SMSEagle RING: ${firstItem?.message || "Unknown error"}`;
      }
    } catch (error: unknown) {
      logger.error("Failed to make RING call via SMSEagle.");
      logger.error(error);
      callLog.callCostInUSDCents = 0;
      callLog.status = CallStatus.Error;
      const errorMessage: string =
        error instanceof Error && error.message
          ? error.message
          : `${error as string}`;
      callLog.statusMessage = errorMessage;
      sendError = error instanceof Error ? error : new Error(errorMessage);
    }

    if (options.projectId) {
      await CallLogService.create({
        data: callLog,
        props: { isRoot: true },
      });
    }

    if (options.userOnCallLogTimelineId) {
      await UserOnCallLogTimelineService.updateOneById({
        id: options.userOnCallLogTimelineId,
        data: {
          status:
            callLog.status === CallStatus.Success
              ? UserNotificationStatus.Sent
              : UserNotificationStatus.Error,
          statusMessage: callLog.statusMessage,
        },
        props: { isRoot: true },
      });
    }

    if (sendError) {
      throw sendError;
    }
  }

  // --- TTS Advanced: POST /api/v2/calls/tts_advanced ---
  public static async makeTtsAdvancedCall(
    message: SMSEagleTtsMessage,
    options: {
      projectId?: ObjectID | undefined;
      isSensitive?: boolean | undefined;
      userOnCallLogTimelineId?: ObjectID | undefined;
      incidentId?: ObjectID | undefined;
      alertId?: ObjectID | undefined;
      monitorId?: ObjectID | undefined;
      scheduledMaintenanceId?: ObjectID | undefined;
      statusPageId?: ObjectID | undefined;
      statusPageAnnouncementId?: ObjectID | undefined;
      userId?: ObjectID | undefined;
      onCallPolicyId?: ObjectID | undefined;
      onCallPolicyEscalationRuleId?: ObjectID | undefined;
      onCallDutyPolicyExecutionLogTimelineId?: ObjectID | undefined;
      onCallScheduleId?: ObjectID | undefined;
      teamId?: ObjectID | undefined;
    } = {},
  ): Promise<void> {
    let sendError: Error | null = null;
    const callLog: CallLog = new CallLog();

    try {
      SMSEagleService.validateRecipients(message);

      if (!message.body) {
        throw new BadDataException("TTS message body is required");
      }

      const isSensitiveMessage: boolean = Boolean(options.isSensitive);
      const messageSummary: string = isSensitiveMessage
        ? SENSITIVE_MESSAGE_PLACEHOLDER
        : message.body;

      callLog.toNumber =
        message.to && message.to.length > 0
          ? new Phone(message.to[0]!)
          : new Phone("SMSEagle-contacts");
      callLog.fromNumber = new Phone("SMSEagle");
      callLog.callData = JSON.parse(
        JSON.stringify({ type: "tts_advanced", text: messageSummary }),
      ) as JSON;
      callLog.callCostInUSDCents = 0;
      callLog.status = CallStatus.Success;

      if (options.projectId) {
        callLog.projectId = options.projectId;
      }

      if (options.incidentId) {
        callLog.incidentId = options.incidentId;
      }

      if (options.alertId) {
        callLog.alertId = options.alertId;
      }

      if (options.monitorId) {
        callLog.monitorId = options.monitorId;
      }

      if (options.scheduledMaintenanceId) {
        callLog.scheduledMaintenanceId = options.scheduledMaintenanceId;
      }

      if (options.statusPageId) {
        callLog.statusPageId = options.statusPageId;
      }

      if (options.statusPageAnnouncementId) {
        callLog.statusPageAnnouncementId = options.statusPageAnnouncementId;
      }

      if (options.userId) {
        callLog.userId = options.userId;
      }

      if (options.teamId) {
        callLog.teamId = options.teamId;
      }

      if (options.onCallPolicyId) {
        callLog.onCallDutyPolicyId = options.onCallPolicyId;
      }

      if (options.onCallPolicyEscalationRuleId) {
        callLog.onCallDutyPolicyEscalationRuleId =
          options.onCallPolicyEscalationRuleId;
      }

      if (options.onCallScheduleId) {
        callLog.onCallDutyPolicyScheduleId = options.onCallScheduleId;
      }

      const config: SMSEagleConfig | null = await getSMSEagleConfig();

      if (!config) {
        throw new BadDataException(
          "SMSEagle is not configured. Please set API URL and access token in the Admin Dashboard.",
        );
      }

      if (options.projectId) {
        const project: Project | null = await ProjectService.findOneById({
          id: options.projectId,
          select: {
            enableCallNotifications: true,
            name: true,
          },
          props: { isRoot: true },
        });

        if (!project) {
          callLog.status = CallStatus.Error;
          callLog.statusMessage = `Project ${options.projectId.toString()} not found.`;
          logger.error(callLog.statusMessage);
          await CallLogService.create({
            data: callLog,
            props: { isRoot: true },
          });
          return;
        }

        if (project.enableCallNotifications === false) {
          callLog.status = CallStatus.Error;
          callLog.statusMessage =
            "Call notifications are disabled for this project.";
          logger.error(callLog.statusMessage);
          await CallLogService.create({
            data: callLog,
            props: { isRoot: true },
          });
          return;
        }
      }

      const payload: JSONObject = {
        ...SMSEagleService.recipientsToBody(message),
        text: message.body,
      };

      if (message.voiceId !== undefined) {
        payload["voice_id"] = message.voiceId;
      }

      if (message.speed !== undefined) {
        payload["speed"] = message.speed;
      }

      const responseItems: SMSEagleResponseItem[] =
        await SMSEagleService.makeApiCall(
          config,
          "/api/v2/calls/tts_advanced",
          payload,
        );

      const firstItem: SMSEagleResponseItem | undefined = responseItems[0];

      if (firstItem && firstItem.status === "queued") {
        callLog.status = CallStatus.Success;
        callLog.statusMessage = `SMSEagle TTS: ${firstItem.message || "Queued"}. ID: ${String(firstItem.id)}`;
      } else {
        callLog.status = CallStatus.Error;
        callLog.statusMessage = `SMSEagle TTS: ${firstItem?.message || "Unknown error"}`;
      }
    } catch (error: unknown) {
      logger.error("Failed to make TTS call via SMSEagle.");
      logger.error(error);
      callLog.callCostInUSDCents = 0;
      callLog.status = CallStatus.Error;
      const errorMessage: string =
        error instanceof Error && error.message
          ? error.message
          : `${error as string}`;
      callLog.statusMessage = errorMessage;
      sendError = error instanceof Error ? error : new Error(errorMessage);
    }

    if (options.projectId) {
      await CallLogService.create({
        data: callLog,
        props: { isRoot: true },
      });
    }

    if (options.userOnCallLogTimelineId) {
      await UserOnCallLogTimelineService.updateOneById({
        id: options.userOnCallLogTimelineId,
        data: {
          status:
            callLog.status === CallStatus.Success
              ? UserNotificationStatus.Sent
              : UserNotificationStatus.Error,
          statusMessage: callLog.statusMessage,
        },
        props: { isRoot: true },
      });
    }

    if (sendError) {
      throw sendError;
    }
  }

  private static validateRecipients(recipients: SMSEagleRecipients): void {
    const hasTo: boolean = Boolean(recipients.to && recipients.to.length > 0);
    const hasContacts: boolean = Boolean(
      recipients.contacts && recipients.contacts.length > 0,
    );
    const hasGroups: boolean = Boolean(
      recipients.groups && recipients.groups.length > 0,
    );

    if (!hasTo && !hasContacts && !hasGroups) {
      throw new BadDataException(
        "At least one recipient is required: provide phone numbers (to), contact IDs (contacts), or group IDs (groups).",
      );
    }
  }

  private static recipientsToBody(recipients: SMSEagleRecipients): JSONObject {
    const body: JSONObject = {};

    if (recipients.to && recipients.to.length > 0) {
      body["to"] = recipients.to;
    }

    if (recipients.contacts && recipients.contacts.length > 0) {
      body["contacts"] = recipients.contacts;
    }

    if (recipients.groups && recipients.groups.length > 0) {
      body["groups"] = recipients.groups;
    }

    return body;
  }

  private static async makeApiCall(
    config: SMSEagleConfig,
    endpoint: string,
    body: JSONObject,
  ): Promise<SMSEagleResponseItem[]> {
    const url: URL = URL.fromString(
      config.apiUrl.replace(/\/$/, "") + endpoint,
    );

    const response: HTTPResponse<JSONObject> | HTTPErrorResponse =
      await API.post<JSONObject>({
        url,
        data: body,
        headers: {
          "access-token": config.accessToken,
          "Content-Type": "application/json",
        },
      });

    if (response instanceof HTTPErrorResponse) {
      const errorMsg: string =
        (response.data?.["message"] as string) ||
        "SMSEagle API request failed";
      throw new BadDataException(errorMsg);
    }

    const responseData: JSONArray | JSONObject = (response.jsonData ||
      response.data ||
      []) as JSONArray | JSONObject;

    if (Array.isArray(responseData)) {
      return responseData as unknown as SMSEagleResponseItem[];
    }

    return [responseData as unknown as SMSEagleResponseItem];
  }
}
