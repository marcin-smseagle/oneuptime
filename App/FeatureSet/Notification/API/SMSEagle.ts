import SMSEagleService from "../Services/SMSEagleService";
import {
  SMSEagleSmsMessage,
  SMSEagleRingMessage,
  SMSEagleTtsMessage,
} from "Common/Types/SMSEagle/SMSEagleMessage";
import BadDataException from "Common/Types/Exception/BadDataException";
import { JSONArray, JSONObject } from "Common/Types/JSON";
import ObjectID from "Common/Types/ObjectID";
import ClusterKeyAuthorization from "Common/Server/Middleware/ClusterKeyAuthorization";
import UserMiddleware from "Common/Server/Middleware/UserAuthorization";
import Express, {
  ExpressRequest,
  ExpressResponse,
  ExpressRouter,
  NextFunction,
} from "Common/Server/Utils/Express";
import Response from "Common/Server/Utils/Response";

const router: ExpressRouter = Express.getRouter();

router.post(
  "/send-sms",
  ClusterKeyAuthorization.isAuthorizedServiceMiddleware,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const body: JSONObject = req.body as JSONObject;

      if (!body["body"]) {
        throw new BadDataException("`body` is required");
      }

      const message: SMSEagleSmsMessage = {
        body: String(body["body"]),
        ...parseRecipients(body),
      };

      await SMSEagleService.sendSms(message, {
        projectId: body["projectId"]
          ? new ObjectID(body["projectId"] as string)
          : undefined,
        isSensitive: Boolean(body["isSensitive"]),
        userOnCallLogTimelineId: body["userOnCallLogTimelineId"]
          ? new ObjectID(body["userOnCallLogTimelineId"] as string)
          : undefined,
        incidentId: body["incidentId"]
          ? new ObjectID(body["incidentId"] as string)
          : undefined,
        alertId: body["alertId"]
          ? new ObjectID(body["alertId"] as string)
          : undefined,
        monitorId: body["monitorId"]
          ? new ObjectID(body["monitorId"] as string)
          : undefined,
        scheduledMaintenanceId: body["scheduledMaintenanceId"]
          ? new ObjectID(body["scheduledMaintenanceId"] as string)
          : undefined,
        statusPageId: body["statusPageId"]
          ? new ObjectID(body["statusPageId"] as string)
          : undefined,
        statusPageAnnouncementId: body["statusPageAnnouncementId"]
          ? new ObjectID(body["statusPageAnnouncementId"] as string)
          : undefined,
        userId: body["userId"]
          ? new ObjectID(body["userId"] as string)
          : undefined,
        onCallPolicyId: body["onCallPolicyId"]
          ? new ObjectID(body["onCallPolicyId"] as string)
          : undefined,
        onCallPolicyEscalationRuleId: body["onCallPolicyEscalationRuleId"]
          ? new ObjectID(body["onCallPolicyEscalationRuleId"] as string)
          : undefined,
        onCallDutyPolicyExecutionLogTimelineId: body[
          "onCallDutyPolicyExecutionLogTimelineId"
        ]
          ? new ObjectID(
              body["onCallDutyPolicyExecutionLogTimelineId"] as string,
            )
          : undefined,
        onCallScheduleId: body["onCallScheduleId"]
          ? new ObjectID(body["onCallScheduleId"] as string)
          : undefined,
        teamId: body["teamId"]
          ? new ObjectID(body["teamId"] as string)
          : undefined,
      });

      return Response.sendEmptySuccessResponse(req, res);
    } catch (err) {
      return next(err);
    }
  },
);

router.post(
  "/send-ring",
  ClusterKeyAuthorization.isAuthorizedServiceMiddleware,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const body: JSONObject = req.body as JSONObject;

      const message: SMSEagleRingMessage = {
        duration: (body["duration"] as number) || undefined,
        ...parseRecipients(body),
      };

      await SMSEagleService.makeRingCall(message, {
        projectId: body["projectId"]
          ? new ObjectID(body["projectId"] as string)
          : undefined,
        isSensitive: Boolean(body["isSensitive"]),
        userOnCallLogTimelineId: body["userOnCallLogTimelineId"]
          ? new ObjectID(body["userOnCallLogTimelineId"] as string)
          : undefined,
        incidentId: body["incidentId"]
          ? new ObjectID(body["incidentId"] as string)
          : undefined,
        alertId: body["alertId"]
          ? new ObjectID(body["alertId"] as string)
          : undefined,
        monitorId: body["monitorId"]
          ? new ObjectID(body["monitorId"] as string)
          : undefined,
        scheduledMaintenanceId: body["scheduledMaintenanceId"]
          ? new ObjectID(body["scheduledMaintenanceId"] as string)
          : undefined,
        statusPageId: body["statusPageId"]
          ? new ObjectID(body["statusPageId"] as string)
          : undefined,
        statusPageAnnouncementId: body["statusPageAnnouncementId"]
          ? new ObjectID(body["statusPageAnnouncementId"] as string)
          : undefined,
        userId: body["userId"]
          ? new ObjectID(body["userId"] as string)
          : undefined,
        onCallPolicyId: body["onCallPolicyId"]
          ? new ObjectID(body["onCallPolicyId"] as string)
          : undefined,
        onCallPolicyEscalationRuleId: body["onCallPolicyEscalationRuleId"]
          ? new ObjectID(body["onCallPolicyEscalationRuleId"] as string)
          : undefined,
        onCallDutyPolicyExecutionLogTimelineId: body[
          "onCallDutyPolicyExecutionLogTimelineId"
        ]
          ? new ObjectID(
              body["onCallDutyPolicyExecutionLogTimelineId"] as string,
            )
          : undefined,
        onCallScheduleId: body["onCallScheduleId"]
          ? new ObjectID(body["onCallScheduleId"] as string)
          : undefined,
        teamId: body["teamId"]
          ? new ObjectID(body["teamId"] as string)
          : undefined,
      });

      return Response.sendEmptySuccessResponse(req, res);
    } catch (err) {
      return next(err);
    }
  },
);

router.post(
  "/send-tts",
  ClusterKeyAuthorization.isAuthorizedServiceMiddleware,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const body: JSONObject = req.body as JSONObject;

      if (!body["body"]) {
        throw new BadDataException("`body` is required");
      }

      const message: SMSEagleTtsMessage = {
        body: String(body["body"]),
        voiceId: (body["voiceId"] as number) || undefined,
        speed: (body["speed"] as number) || undefined,
        ...parseRecipients(body),
      };

      await SMSEagleService.makeTtsAdvancedCall(message, {
        projectId: body["projectId"]
          ? new ObjectID(body["projectId"] as string)
          : undefined,
        isSensitive: Boolean(body["isSensitive"]),
        userOnCallLogTimelineId: body["userOnCallLogTimelineId"]
          ? new ObjectID(body["userOnCallLogTimelineId"] as string)
          : undefined,
        incidentId: body["incidentId"]
          ? new ObjectID(body["incidentId"] as string)
          : undefined,
        alertId: body["alertId"]
          ? new ObjectID(body["alertId"] as string)
          : undefined,
        monitorId: body["monitorId"]
          ? new ObjectID(body["monitorId"] as string)
          : undefined,
        scheduledMaintenanceId: body["scheduledMaintenanceId"]
          ? new ObjectID(body["scheduledMaintenanceId"] as string)
          : undefined,
        statusPageId: body["statusPageId"]
          ? new ObjectID(body["statusPageId"] as string)
          : undefined,
        statusPageAnnouncementId: body["statusPageAnnouncementId"]
          ? new ObjectID(body["statusPageAnnouncementId"] as string)
          : undefined,
        userId: body["userId"]
          ? new ObjectID(body["userId"] as string)
          : undefined,
        onCallPolicyId: body["onCallPolicyId"]
          ? new ObjectID(body["onCallPolicyId"] as string)
          : undefined,
        onCallPolicyEscalationRuleId: body["onCallPolicyEscalationRuleId"]
          ? new ObjectID(body["onCallPolicyEscalationRuleId"] as string)
          : undefined,
        onCallDutyPolicyExecutionLogTimelineId: body[
          "onCallDutyPolicyExecutionLogTimelineId"
        ]
          ? new ObjectID(
              body["onCallDutyPolicyExecutionLogTimelineId"] as string,
            )
          : undefined,
        onCallScheduleId: body["onCallScheduleId"]
          ? new ObjectID(body["onCallScheduleId"] as string)
          : undefined,
        teamId: body["teamId"]
          ? new ObjectID(body["teamId"] as string)
          : undefined,
      });

      return Response.sendEmptySuccessResponse(req, res);
    } catch (err) {
      return next(err);
    }
  },
);

// --- Test endpoints (called from Admin Dashboard, UserAuth required) ---

router.post(
  "/test-sms",
  UserMiddleware.getUserMiddleware,
  UserMiddleware.requireUserAuthentication,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const body: JSONObject = req.body as JSONObject;

      if (!body["toPhone"]) {
        throw new BadDataException("toPhone is required");
      }

      const message: SMSEagleSmsMessage = {
        to: [String(body["toPhone"])],
        body: "This is a test SMS from OneUptime via SMSEagle.",
      };

      await SMSEagleService.sendSms(message, {
        isSensitive: false,
      });

      return Response.sendEmptySuccessResponse(req, res);
    } catch (err) {
      return next(err);
    }
  },
);

router.post(
  "/test-ring",
  UserMiddleware.getUserMiddleware,
  UserMiddleware.requireUserAuthentication,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const body: JSONObject = req.body as JSONObject;

      if (!body["toPhone"]) {
        throw new BadDataException("toPhone is required");
      }

      const message: SMSEagleRingMessage = {
        to: [String(body["toPhone"])],
        duration: 10,
      };

      await SMSEagleService.makeRingCall(message, {
        isSensitive: false,
      });

      return Response.sendEmptySuccessResponse(req, res);
    } catch (err) {
      return next(err);
    }
  },
);

router.post(
  "/test-tts",
  UserMiddleware.getUserMiddleware,
  UserMiddleware.requireUserAuthentication,
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const body: JSONObject = req.body as JSONObject;

      if (!body["toPhone"]) {
        throw new BadDataException("toPhone is required");
      }

      const message: SMSEagleTtsMessage = {
        to: [String(body["toPhone"])],
        body: "This is a test text to speech call from OneUptime via SMSEagle.",
      };

      await SMSEagleService.makeTtsAdvancedCall(message, {
        isSensitive: false,
      });

      return Response.sendEmptySuccessResponse(req, res);
    } catch (err) {
      return next(err);
    }
  },
);

function parseRecipients(body: JSONObject): {
  to?: string[];
  contacts?: number[];
  groups?: number[];
} {
  const recipients: {
    to?: string[];
    contacts?: number[];
    groups?: number[];
  } = {};

  if (body["to"]) {
    if (Array.isArray(body["to"])) {
      recipients.to = (body["to"] as JSONArray).map((item: unknown) => {
        return String(item);
      });
    } else {
      recipients.to = [String(body["to"])];
    }
  }

  if (body["contacts"] && Array.isArray(body["contacts"])) {
    recipients.contacts = (body["contacts"] as JSONArray).map(
      (item: unknown) => {
        return Number(item);
      },
    );
  }

  if (body["groups"] && Array.isArray(body["groups"])) {
    recipients.groups = (body["groups"] as JSONArray).map((item: unknown) => {
      return Number(item);
    });
  }

  return recipients;
}

export default router;
