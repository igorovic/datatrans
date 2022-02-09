/* tslint:disable */
/* eslint-disable */
/**
 * Datatrans API Reference
 * Welcome to the Datatrans API reference. This document is meant to be used in combination with https://docs.datatrans.ch. All the parameters used in the curl and web samples are described here. Reach out to support@datatrans.ch if something is missing or unclear.  Last updated: 10.01.22 - 17:50 UTC  # Payment Process The following steps describe how transactions are processed with Datatrans. We separate payments in three categories: Customer-initiated payments, merchant-initiated payments and after the payment.  ## Customer Initiated Payments We have three integrations available: [Redirect](https://docs.datatrans.ch/docs/redirect-lightbox), [Lightbox](https://docs.datatrans.ch/docs/redirect-lightbox) and [Secure Fields](https://docs.datatrans.ch/docs/secure-fields).  ### Redirect & Lightbox - Send the required parameters to initialize a `transactionId` to the [init](#operation/init) endpoint. - Let the customer proceed with the payment by redirecting them to the correct link - or showing them your payment form.   - Redirect: Redirect the browser to the following URL structure     ```     https://pay.sandbox.datatrans.com/v1/start/transactionId     ```   - Lightbox: Load the JavaScript library and initialize the payment form:     ```js     <script src=\"https://pay.sandbox.datatrans.com/upp/payment/js/datatrans-2.0.0.js\">     ```     ```js     payButton.onclick = function() {       Datatrans.startPayment({         transactionId:  \"transactionId\"       });     };     ``` - Your customer proceeds with entering their payment information and finally hits the pay or continue button. - For card payments, we check the payment information with your acquirers. The acquirers check the payment information with the issuing parties. The customer proceeds with 3D Secure whenever required. - Once the transaction is completed, we return all relevant information to you (check our [Webhook section](#section/Webhook) for more details). The browser will be redirected to the success, cancel or error URL with our `datatransTrxId` in the response.  ### Secure Fields - Send the required parameters to initialize a transactionId to our [secureFieldsInit](#operation/secureFieldsInit) endpoint. - Load the Secure Fields JavaScript libarary and initialize Secure Fields:   ```js   <script src=\"https://pay.sandbox.datatrans.com/upp/payment/js/secure-fields-2.0.0.js\">   ```   ```js   var secureFields = new SecureFields();   secureFields.init(     {{transactionId}}, {         cardNumber: \"cardNumberPlaceholder\",         cvv: \"cvvPlaceholder\",     });   ``` - Handle the success event of the secureFields.submit() call. - If 3D authentication is required for a specific transaction, the `redirect` property inside the `data` object will indicate the URL that the customer needs to be redirected to. - Use the [Authorize an authenticated transaction](#operation/authorize-split)endpoint to fully authorize the Secure Fields transaction. This is required to finalize the authorization process with Secure Fields.  ## Merchant Initiated Payments Once you have processed a customer-initiated payment or registration you can call our API to process recurring payments. Check our [authorize](#operation/authorize) endpoint to see how to create a recurring payment or our [validate](#operation/validate) endpoint to validate your customers’ saved payment details.  ## After the payment Use the `transactionId` to check the [status](#operation/status) and to [settle](#operation/settle), [cancel](#operation/cancel) or [refund](#operation/credit) a transaction.  # Idempotency  To retry identical requests with the same effect without accidentally performing the same operation more than needed, you can add the header `Idempotency-Key` to your requests. This is useful when API calls are disrupted or you did not receive a response. In other words, retrying identical requests with our idempotency key will not have any side effects. We will return the same response for any identical request that includes the same idempotency key.  If your request failed to reach our servers, no idempotent result is saved because no API endpoint processed your request. In such cases, you can simply retry your operation safely. Idempotency keys remain stored for 60 minutes. After 60 minutes have passed, sending the same request together with the previous idempotency key will create a new operation.  Please note that the idempotency key has to be unique for each request and has to be defined by yourself. We recommend assigning a random value as your idempotency key and using UUID v4. Idempotency is only available for `POST` requests.  Idempotency was implemented according to the [\"The Idempotency HTTP Header Field\" Internet-Draft](https://tools.ietf.org/id/draft-idempotency-header-01.html)  |Scenario|Condition|Expectation| |:---|:---|:---| |First time request|Idempotency key has not been seen during the past 60 minutes.|The request is processed normally.| |Repeated request|The request was retried after the first time request completed.| The response from the first time request will be returned.| |Repeated request|The request was retried before the first time request completed.| 409 Conflict. It is recommended that clients time their retries using an exponential backoff algorithm.| |Repeated request|The request body is different than the one from the first time request.| 422 Unprocessable Entity.|  Example: ```sh curl -i \'https://api.sandbox.datatrans.com/v1/transactions\' \\     -H \'Authorization: Basic MTEwMDAwNzI4MzpobDJST1NScUN2am5EVlJL\' \\     -H \'Content-Type: application/json; charset=UTF-8\' \\     -H \'Idempotency-Key: e75d621b-0e56-4b71-b889-1acec3e9d870\' \\     -d \'{     \"refno\" : \"58b389331dad\",     \"amount\" : 1000,     \"currency\" : \"CHF\",     \"paymentMethods\" : [ \"VIS\", \"ECA\", \"PAP\" ],     \"option\" : {        \"createAlias\" : true     } }\' ```  # Authentication Authentication to the APIs is performed with HTTP basic authentication. Your `merchantId` acts as the username. To get the password, login to the <a href=\'https://admin.sandbox.datatrans.com/\' target=\'_blank\'>dashboard</a> and navigate to the security settings under `UPP Administration > Security`.  Create a base64 encoded value consisting of merchantId and password (most HTTP clients are able to handle the base64 encoding automatically) and submit the Authorization header with your requests. Here’s an example:  ``` base64(merchantId:password) = MTAwMDAxMTAxMTpYMWVXNmkjJA== ```  ``` Authorization: Basic MTAwMDAxMTAxMTpYMWVXNmkjJA== ````  All API requests must be done over HTTPS with TLS >= 1.2.   <!-- ReDoc-Inject: <security-definitions> -->  # Errors Datatrans uses HTTP response codes to indicate if an API call was successful or resulted in a failure. HTTP `2xx` status codes indicate a successful API call whereas HTTP `4xx` status codes indicate client errors or if something with the transaction went wrong - for example a decline. In rare cases HTTP `5xx` status codes are returned. Those indicate errors on Datatrans side.  Here’s the payload of a sample HTTP `400` error, showing that your request has wrong values in it ``` {   \"error\" : {     \"code\" : \"INVALID_PROPERTY\",     \"message\" : \"init.initRequest.currency The given currency does not have the right format\"   } } ```  # Webhook After each authorization Datatrans tries to call the configured Webhook (POST) URL. The Webhook URL can be configured within the <a href=\'https://admin.sandbox.datatrans.com/\' target=\'_blank\'>dashboard</a>. The Webhook payload contains the same information as the response of a [Status API](#operation/status) call.  ## Webhook signing If you want your webhook requests to be signed, setup a HMAC key in your merchant configuration. To get your HMAC key, login to our dashboard and navigate to the Security settings in your merchant configuration to view your server to server security settings. Select the radio button `Important parameters will be digitally signed (HMAC-SHA256) and sent with payment messages`. Datatrans will use this key to sign the webhook payload and will add a `Datatrans-Signature` HTTP request header:  ```sh Datatrans-Signature: t=1559303131511,s0=33819a1220fd8e38fc5bad3f57ef31095fac0deb38c001ba347e694f48ffe2fc ```  On your server, calculate the signature of the webhook payload and finally compare it to `s0`. `timestamp` is the `t` value from the Datatrans-Signature header, `payload` represents all UTF-8 bytes from the body of the payload and finally `key` is the HMAC key you configured within the dashboard. If the value of `sign` is equal to `s0` from the `Datatrans-Signature` header, the webhook payload is valid and was not tampered.  **Java**  ```java // hex bytes of the key byte[] key = Hex.decodeHex(key);  // Create sign with timestamp and payload String algorithm = \"HmacSha256\"; SecretKeySpec macKey = new SecretKeySpec(key, algorithm); Mac mac = Mac.getInstance(algorithm); mac.init(macKey); mac.update(String.valueOf(timestamp).getBytes()); byte[] result = mac.doFinal(payload.getBytes()); String sign = Hex.encodeHexString(result); ```  **Python**  ```python # hex bytes of the key key_hex_bytes = bytes.fromhex(key)  # Create sign with timestamp and payload sign = hmac.new(key_hex_bytes, bytes(str(timestamp) + payload, \'utf-8\'), hashlib.sha256) ```  # Release notes <details>   <summary>Details</summary>    ### 2.0.24 - 15.12.2021 🎄 * Added full support for `invoiceOnDelivery` when using `MFX` or `MPX` as payment method. * The Status API now returns the ESR data for `MFX` and `MPX` when `invoiceOnDelivery=true` was used.  ### 2.0.23 - 20.10.2021 * Added support for Klarna `KLN` hotel extended merchant data (EMD)  ### 2.0.22 - 21.07.2021 * Added full support for Swisscom Pay `ESY` * The `marketplace` object now accepts an array of splits.  ### 2.0.21 - 21.05.2021 * Updated idempotency handling. See the details here https://api-reference.datatrans.ch/#section/Idempotency  ### 2.0.20 - 18.05.2021 * In addition to `debit` and `credit` the Status API now also returns `prepaid` in the `card.info.type` property. * paysafecard - Added support for `merchantClientId`   ### 2.0.19 - 03.05.2021 * Fixed `PAP.orderTransactionId` to be a string * Added support for `PAP.fraudSessionId` (PayPal FraudNet)  ### 2.0.18 - 21.04.2021 * Added new `POST /v1/transactions/screen` API to check a customer\'s credit score before sending an actual authorization request. Currently only `INT` (Byjuno) is supported.  ### 2.0.17 - 20.04.2021 * Added new `GET /v1/aliases` API to receive more information about a particular alias.  ### 2.0.16 - 13.04.2021 * Added support for Migros Bank E-Pay <code>MDP</code>  ### 2.0.15 - 24.03.2021 * Byjuno - renamed `subPaymentMethod` to `subtype` (`subPaymentMethod` still works) * Klarna - Returning the `subtype` (`pay_now`, `pay_later`, `pay_over_time`, `direct_debit`, `direct_bank_transfer`) from the Status API  ### 2.0.14 - 09.03.2021 * Byjuno - Added support for `customData` and `firstRateAmount` * Returning the `transactionId` (if available) for a failed Refund API call.  ### 2.0.13 - 15.02.2021 * The Status and Webhook payloads now include the `language` property * Fixed a bug where `card.3D.transStatusReason` and `card.3D.cardholderInfo` was not returned  ### 2.0.12 - 04.02.2021 * Added support for PayPal transaction context (STC) * Fixed a bug where the transaction status did not switch to `failed` after it timed out * Fixed a bug with `option.rememberMe` not returning the Alias from the Status API  ### 2.0.11 - 01.02.2021 * Returning `card.3D.transStatusReason` (if available) from the Status API  ### 2.0.10 - 18.01.2021 * Returning `card.3D.cardholderInfo` (if available) from the Status API  ### 2.0.9 - 21.12.2020 * Added support for Alipay <code>ALP</code>  ### 2.0.8 - 21.12.2020 * Added full support for Klarna <code>KLN</code> * Added support for swissbilling <code>SWB</code>  </details> 
 *
 * The version of the OpenAPI document: 2.0.24
 * Contact: support@datatrans.ch
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import { Configuration } from './configuration';
import globalAxios, { AxiosPromise, AxiosInstance, AxiosRequestConfig } from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from './common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from './base';

/**
 * Base64 encoded attachment
 * @export
 * @interface AccardaAttachment
 */
export interface AccardaAttachment {
    /**
     * The mime type of the attachment
     * @type {string}
     * @memberof AccardaAttachment
     */
    'mimeType'?: string;
    /**
     * The name of the attachment
     * @type {string}
     * @memberof AccardaAttachment
     */
    'name'?: string;
    /**
     * Base64 encoded value of the attachment
     * @type {string}
     * @memberof AccardaAttachment
     */
    'value'?: string;
}
/**
 * Accarda specific request parameters.
 * @export
 * @interface AccardaRequest
 */
export interface AccardaRequest {
    /**
     * Defines the type of the payment
     * @type {string}
     * @memberof AccardaRequest
     */
    'mode': AccardaRequestModeEnum;
    /**
     * 
     * @type {Installment}
     * @memberof AccardaRequest
     */
    'installment'?: Installment;
    /**
     * The invoice channel
     * @type {string}
     * @memberof AccardaRequest
     */
    'channel'?: AccardaRequestChannelEnum;
    /**
     * If `true` the value of `customer.street` will be split into street nameand street number
     * @type {boolean}
     * @memberof AccardaRequest
     */
    'streetSplit'?: boolean;
    /**
     * If `true` only a pre-screening request is done.
     * @type {boolean}
     * @memberof AccardaRequest
     */
    'screeningOnly'?: boolean;
    /**
     * Accarda reference number, mainly useful for B2B orders where the company doing the order might have their own ID to identify the invoice later on within their own systems.
     * @type {string}
     * @memberof AccardaRequest
     */
    'orderNumber'?: string;
    /**
     * Amount in the basket payed by coupon or other payment instruments.
     * @type {number}
     * @memberof AccardaRequest
     */
    'couponAmount'?: number;
    /**
     * List of base64 encoded attachments
     * @type {Array<AccardaAttachment>}
     * @memberof AccardaRequest
     */
    'attachments'?: Array<AccardaAttachment>;
}

export const AccardaRequestModeEnum = {
    Invoice: 'invoice',
    Installment: 'installment'
} as const;

export type AccardaRequestModeEnum = typeof AccardaRequestModeEnum[keyof typeof AccardaRequestModeEnum];
export const AccardaRequestChannelEnum = {
    Email: 'email',
    Print: 'print',
    Insurance: 'insurance',
    Merchant: 'merchant'
} as const;

export type AccardaRequestChannelEnum = typeof AccardaRequestChannelEnum[keyof typeof AccardaRequestChannelEnum];

/**
 * AccommodationMetaData
 * @export
 * @interface AccommodationMetaData
 */
export interface AccommodationMetaData {
    /**
     * The version of AccommodationMetaData field (used for tracking schema changes to the field)
     * @type {string}
     * @memberof AccommodationMetaData
     */
    'version'?: string;
    /**
     * The number of nights that the accommodation was booked for.
     * @type {number}
     * @memberof AccommodationMetaData
     */
    'lengthOfStay'?: number;
    /**
     * The number of guests for which the accommodation is booked
     * @type {number}
     * @memberof AccommodationMetaData
     */
    'numberOfGuests'?: number;
    /**
     * The date on which the accommodation starts. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`). Internally, Amazon will store the number of days and hours between accommodation.startDate and time of the purchase.
     * @type {string}
     * @memberof AccommodationMetaData
     */
    'startDate'?: string;
    /**
     * The date on which the accommodation ends. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`). If accommodation.lengthOfStay is given, we default to an endDate derived from startDate and lengthOfStay.
     * @type {string}
     * @memberof AccommodationMetaData
     */
    'endDate'?: string;
    /**
     * Star rating of the accommodation. From 0 (for no star rating) to 5 (for five star hotels)
     * @type {number}
     * @memberof AccommodationMetaData
     */
    'starRating'?: number;
    /**
     * Days since the buyer booked the same accommodation last time. Use value -1 if buyer books this accommodation for the first time.
     * @type {number}
     * @memberof AccommodationMetaData
     */
    'bookedLastTime'?: number;
    /**
     * The city where the accommodation is located. Example: Milan.
     * @type {string}
     * @memberof AccommodationMetaData
     */
    'city'?: string;
    /**
     * ISO 3166-1 alpha-2, two-letter country code, representing the country where the accommodation is located. Example: IT.
     * @type {string}
     * @memberof AccommodationMetaData
     */
    'countryCode'?: string;
    /**
     * The zip code of the accommodation address. Example: 40127.
     * @type {string}
     * @memberof AccommodationMetaData
     */
    'zipCode'?: string;
    /**
     * Describes the type of accommodation, valid values:[Hotel]
     * @type {string}
     * @memberof AccommodationMetaData
     */
    'accommodationType'?: string;
    /**
     * The name of the accommodation, as provided to the merchant by the accommodation itself.
     * @type {string}
     * @memberof AccommodationMetaData
     */
    'accommodationName'?: string;
    /**
     * Suite, Standard or Deluxe accommodation
     * @type {string}
     * @memberof AccommodationMetaData
     */
    'class'?: AccommodationMetaDataClassEnum;
}

export const AccommodationMetaDataClassEnum = {
    Suite: 'SUITE',
    Standard: 'STANDARD',
    Deluxe: 'DELUXE'
} as const;

export type AccommodationMetaDataClassEnum = typeof AccommodationMetaDataClassEnum[keyof typeof AccommodationMetaDataClassEnum];

/**
 * 
 * @export
 * @interface Action
 */
export interface Action {
    /**
     * The action performed.
     * @type {string}
     * @memberof Action
     */
    'action'?: ActionActionEnum;
    /**
     * Indicates if auto settlement was used. Only applicable if action was `authorize`
     * @type {boolean}
     * @memberof Action
     */
    'autoSettle'?: boolean;
    /**
     * The amount used.
     * @type {number}
     * @memberof Action
     */
    'amount'?: number;
    /**
     * From where the action originated.
     * @type {string}
     * @memberof Action
     */
    'source'?: ActionSourceEnum;
    /**
     * Date when the action was performed.
     * @type {string}
     * @memberof Action
     */
    'date'?: string;
    /**
     * Whether the action was successful or not.
     * @type {boolean}
     * @memberof Action
     */
    'success'?: boolean;
    /**
     * 
     * @type {MarketPlace}
     * @memberof Action
     */
    'marketplace'?: MarketPlace;
    /**
     * The IP address from where the action originated from.
     * @type {string}
     * @memberof Action
     */
    'ip'?: string;
}

export const ActionActionEnum = {
    Init: 'init',
    Authenticate: 'authenticate',
    Authorize: 'authorize',
    Settle: 'settle',
    Credit: 'credit',
    Cancel: 'cancel'
} as const;

export type ActionActionEnum = typeof ActionActionEnum[keyof typeof ActionActionEnum];
export const ActionSourceEnum = {
    Admin: 'admin',
    Amadeus: 'amadeus',
    Ajax: 'ajax',
    Android: 'android',
    Api: 'api',
    Inline: 'inline',
    Ios: 'ios',
    Lightbox: 'lightbox',
    Link: 'link',
    Redirect: 'redirect',
    SecureFields: 'secure_fields',
    System: 'system',
    Web: 'web',
    WebHidden: 'web_hidden',
    Unknown: 'unknown'
} as const;

export type ActionSourceEnum = typeof ActionSourceEnum[keyof typeof ActionSourceEnum];

/**
 * The airline data including ticket details.
 * @export
 * @interface AirlineDataRequest
 */
export interface AirlineDataRequest {
    /**
     * Passenger country code in <a href=\'https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2\' target=\'_blank\'>ISO-3166-1-alpha2</a> format.
     * @type {string}
     * @memberof AirlineDataRequest
     */
    'countryCode'?: string;
    /**
     * IATA agency code
     * @type {string}
     * @memberof AirlineDataRequest
     */
    'agentCode'?: string;
    /**
     * PNR
     * @type {string}
     * @memberof AirlineDataRequest
     */
    'pnr'?: string;
    /**
     * Ticket issuing date. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (`YYYY-MM-DD`).
     * @type {string}
     * @memberof AirlineDataRequest
     */
    'issueDate'?: string;
    /**
     * A list of tickets for this purchase. Note: PAP only supports one ticket.
     * @type {Array<Ticket>}
     * @memberof AirlineDataRequest
     */
    'tickets'?: Array<Ticket>;
}
/**
 * Airline Meta Data
 * @export
 * @interface AirlineMetaData
 */
export interface AirlineMetaData {
    /**
     * The version of AirlineMetaData field (used for tracking schema changes to the field)
     * @type {string}
     * @memberof AirlineMetaData
     */
    'version'?: string;
    /**
     * IATA 2-letter airline code. It identifies the carrier. Example: AA (American Airlines)
     * @type {string}
     * @memberof AirlineMetaData
     */
    'airlineCode'?: string;
    /**
     * Flight departure date. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`). The time mentioned here is local time
     * @type {string}
     * @memberof AirlineMetaData
     */
    'flightDate'?: string;
    /**
     * IATA 3-letter code of the departure airport. Example: CDG
     * @type {string}
     * @memberof AirlineMetaData
     */
    'departureAirport'?: string;
    /**
     * IATA 3-letter code of the departure airport. Example: LUX
     * @type {string}
     * @memberof AirlineMetaData
     */
    'destinationAirport'?: string;
    /**
     * travel class identifier.
     * @type {string}
     * @memberof AirlineMetaData
     */
    'classOfTravel'?: AirlineMetaDataClassOfTravelEnum;
    /**
     * Days since the buyer booked a flight to the same destination last time. Use value -1 if buyer books this destination for the first time.
     * @type {number}
     * @memberof AirlineMetaData
     */
    'bookedLastTime'?: number;
    /**
     * 
     * @type {Passenger}
     * @memberof AirlineMetaData
     */
    'passengers'?: Passenger;
}

export const AirlineMetaDataClassOfTravelEnum = {
    FirstClass: 'FIRST_CLASS',
    BusinessClass: 'BUSINESS_CLASS',
    Economy: 'ECONOMY',
    PremiumEconomy: 'PREMIUM_ECONOMY'
} as const;

export type AirlineMetaDataClassOfTravelEnum = typeof AirlineMetaDataClassOfTravelEnum[keyof typeof AirlineMetaDataClassOfTravelEnum];

/**
 * 
 * @export
 * @interface AliasCardInfoDetail
 */
export interface AliasCardInfoDetail {
    /**
     * The expiry month of the card. Currently not available when the Convert API was used before.
     * @type {string}
     * @memberof AliasCardInfoDetail
     */
    'expiryMonth'?: string;
    /**
     * The expiry year of the card. Currently not available when the Convert API was used before.
     * @type {string}
     * @memberof AliasCardInfoDetail
     */
    'expiryYear'?: string;
    /**
     * 
     * @type {CardInfo}
     * @memberof AliasCardInfoDetail
     */
    'cardInfo'?: CardInfo;
}
/**
 * 
 * @export
 * @interface AliasConvertRequest
 */
export interface AliasConvertRequest {
    /**
     * The legacy alias
     * @type {string}
     * @memberof AliasConvertRequest
     */
    'legacyAlias': string;
    /**
     * The expiry month of the credit card behind alias.
     * @type {string}
     * @memberof AliasConvertRequest
     */
    'expiryMonth'?: string;
    /**
     * The expiry year of the credit card behind the alias
     * @type {string}
     * @memberof AliasConvertRequest
     */
    'expiryYear'?: string;
}
/**
 * 
 * @export
 * @interface AliasConvertResponse
 */
export interface AliasConvertResponse {
    /**
     * The requested alias.
     * @type {string}
     * @memberof AliasConvertResponse
     */
    'alias'?: string;
}
/**
 * 
 * @export
 * @interface AliasInfoResponse
 */
export interface AliasInfoResponse {
    /**
     * The requested alias.
     * @type {string}
     * @memberof AliasInfoResponse
     */
    'alias'?: string;
    /**
     * An unique identifier of the card number. Useful to identify multiple customers\' or the same customer\'s transactions where the same card was used.
     * @type {string}
     * @memberof AliasInfoResponse
     */
    'fingerprint'?: string;
    /**
     * 
     * @type {string}
     * @memberof AliasInfoResponse
     */
    'type'?: AliasInfoResponseTypeEnum;
    /**
     * The nonsensitive masked representation of the value behind the alias (e.g. `490000xxxxxx0003` for aliases of type `CARD`)
     * @type {string}
     * @memberof AliasInfoResponse
     */
    'masked'?: string;
    /**
     * Creation date
     * @type {string}
     * @memberof AliasInfoResponse
     */
    'dateCreated'?: string;
    /**
     * 
     * @type {AliasCardInfoDetail}
     * @memberof AliasInfoResponse
     */
    'card'?: AliasCardInfoDetail;
}

export const AliasInfoResponseTypeEnum = {
    Card: 'CARD',
    Pfc: 'PFC',
    Rek: 'REK',
    Iban: 'IBAN',
    Twi: 'TWI',
    Kln: 'KLN',
    Int: 'INT',
    Pap: 'PAP',
    Esy: 'ESY',
    Mfx: 'MFX',
    Mpx: 'MPX',
    Swp: 'SWP',
    Mdp: 'MDP'
} as const;

export type AliasInfoResponseTypeEnum = typeof AliasInfoResponseTypeEnum[keyof typeof AliasInfoResponseTypeEnum];

/**
 * 
 * @export
 * @interface AliasesError
 */
export interface AliasesError {
    /**
     * 
     * @type {AliasesErrorCode}
     * @memberof AliasesError
     */
    'code'?: AliasesErrorCode;
    /**
     * A human readable message indicating what went wrong.
     * @type {string}
     * @memberof AliasesError
     */
    'message'?: string;
}
/**
 * 
 * @export
 * @enum {string}
 */

export const AliasesErrorCode = {
    UnknownError: 'UNKNOWN_ERROR',
    Unauthorized: 'UNAUTHORIZED',
    InvalidJsonPayload: 'INVALID_JSON_PAYLOAD',
    UnrecognizedProperty: 'UNRECOGNIZED_PROPERTY',
    InvalidProperty: 'INVALID_PROPERTY',
    ClientError: 'CLIENT_ERROR',
    ServerError: 'SERVER_ERROR',
    VelocityError: 'VELOCITY_ERROR',
    AliasNotFound: 'ALIAS_NOT_FOUND',
    IllegalArgument: 'ILLEGAL_ARGUMENT',
    InvalidAlias: 'INVALID_ALIAS'
} as const;

export type AliasesErrorCode = typeof AliasesErrorCode[keyof typeof AliasesErrorCode];


/**
 * 
 * @export
 * @interface AliasesResponseBase
 */
export interface AliasesResponseBase {
    /**
     * 
     * @type {AliasesError}
     * @memberof AliasesResponseBase
     */
    'error'?: AliasesError;
}
/**
 * Alipay specific parameters
 * @export
 * @interface AlipayRequest
 */
export interface AlipayRequest {
    /**
     * Business type of the merchant.
     * @type {string}
     * @memberof AlipayRequest
     */
    'businessType'?: AlipayRequestBusinessTypeEnum;
    /**
     * Name of the hotel. Mandatory when businessType is Hotel.
     * @type {string}
     * @memberof AlipayRequest
     */
    'hotelName'?: string;
    /**
     * Hotel checkin time. Mandatory when business type is Hotel. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof AlipayRequest
     */
    'checkinTime'?: string;
    /**
     * Hotel checkout time. Mandatory when business type is Hotel. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof AlipayRequest
     */
    'checkoutTime'?: string;
    /**
     * Flight number, e.g. LX1234. Mandatory when businessType is Aviation.
     * @type {string}
     * @memberof AlipayRequest
     */
    'flightNumber'?: string;
    /**
     * The flight departure time. Mandatory when businessType is Aviation. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof AlipayRequest
     */
    'departureTime'?: string;
    /**
     * The picture address of admission notice.Mandatory when business type is [ Overseas | Education | Affairs ].
     * @type {string}
     * @memberof AlipayRequest
     */
    'admissionNoticeUrl'?: string;
    /**
     * Goods information. Mandatory when business type is Retailing.
     * @type {string}
     * @memberof AlipayRequest
     */
    'goodsInfo'?: string;
    /**
     * Quantities of goods. Mandatory when business type is Retailing.
     * @type {number}
     * @memberof AlipayRequest
     */
    'totalQuantity'?: number;
    /**
     * Name of business type. Mandatory when business type is Other.
     * @type {string}
     * @memberof AlipayRequest
     */
    'otherBusinessType'?: string;
}

export const AlipayRequestBusinessTypeEnum = {
    Hotel: 'Hotel',
    Aviation: 'Aviation',
    Overseas: 'Overseas',
    Education: 'Education',
    Affairs: 'Affairs',
    Retailing: 'Retailing',
    Other: 'Other'
} as const;

export type AlipayRequestBusinessTypeEnum = typeof AlipayRequestBusinessTypeEnum[keyof typeof AlipayRequestBusinessTypeEnum];

/**
 * Supplementary data for fraud detection by amazon
 * @export
 * @interface AmazonFraudContext
 */
export interface AmazonFraudContext {
    /**
     * 
     * @type {AirlineMetaData}
     * @memberof AmazonFraudContext
     */
    'airlineMetaData'?: AirlineMetaData;
    /**
     * 
     * @type {AccommodationMetaData}
     * @memberof AmazonFraudContext
     */
    'accommodationMetaData'?: AccommodationMetaData;
    /**
     * 
     * @type {BuyerMetaData}
     * @memberof AmazonFraudContext
     */
    'buyerMetaData'?: BuyerMetaData;
    /**
     * 
     * @type {OrderMetaData}
     * @memberof AmazonFraudContext
     */
    'orderMetaData'?: OrderMetaData;
}
/**
 * Amazon Pay specific request parameters
 * @export
 * @interface AmazonPayRequest
 */
export interface AmazonPayRequest {
    /**
     * Represents a description of the billing agreement that is shown in emails to the buyer and on the Amazon Pay website.
     * @type {string}
     * @memberof AmazonPayRequest
     */
    'sellerNote'?: string;
    /**
     * 
     * @type {AmazonFraudContext}
     * @memberof AmazonPayRequest
     */
    'fraudContext'?: AmazonFraudContext;
}
/**
 * The data received from Apple when integrating the \'Buy with Apple Pay\' button. See https://developer.apple.com/documentation/apple_pay_on_the_web for more information.
 * @export
 * @interface ApplePayRequest
 */
export interface ApplePayRequest {
    /**
     * Encrypted payment data.
     * @type {string}
     * @memberof ApplePayRequest
     */
    'data'?: string;
    /**
     * 
     * @type {Header}
     * @memberof ApplePayRequest
     */
    'header'?: Header;
    /**
     * Signature of the payment and header data. The signature includes the signing certificate, its intermediate CA certificate, and information about the signing algorithm.
     * @type {string}
     * @memberof ApplePayRequest
     */
    'signature'?: string;
    /**
     * Version information about the payment token. The token uses `EC_v1` for ECC-encrypted data, and `RSA_v1` for RSA-encrypted data.
     * @type {string}
     * @memberof ApplePayRequest
     */
    'version'?: string;
}
/**
 * Apple Pay specific parameters for the validate request.
 * @export
 * @interface ApplePayValidateRequest
 */
export interface ApplePayValidateRequest {
    /**
     * Encrypted payment data.
     * @type {string}
     * @memberof ApplePayValidateRequest
     */
    'data'?: string;
    /**
     * 
     * @type {Header}
     * @memberof ApplePayValidateRequest
     */
    'header'?: Header;
    /**
     * Signature of the payment and header data. The signature includes the signing certificate, its intermediate CA certificate, and information about the signing algorithm.
     * @type {string}
     * @memberof ApplePayValidateRequest
     */
    'signature'?: string;
    /**
     * Version information about the payment token. The token uses `EC_v1` for ECC-encrypted data, and `RSA_v1` for RSA-encrypted data.
     * @type {string}
     * @memberof ApplePayValidateRequest
     */
    'version'?: string;
}
/**
 * 
 * @export
 * @interface Article
 */
export interface Article {
    /**
     * 
     * @type {string}
     * @memberof Article
     */
    'id'?: string;
    /**
     * 
     * @type {string}
     * @memberof Article
     */
    'name'?: string;
    /**
     * 
     * @type {string}
     * @memberof Article
     */
    'description'?: string;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'price'?: number;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'priceGross'?: number;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'quantity'?: number;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'tax'?: number;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'taxPercent'?: number;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'taxAmount'?: number;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'priceWithoutVAT'?: number;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'singleItemPrice'?: number;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'singleItemPriceWithoutVAT'?: number;
    /**
     * 
     * @type {number}
     * @memberof Article
     */
    'discount'?: number;
    /**
     * 
     * @type {string}
     * @memberof Article
     */
    'type'?: string;
}
/**
 * 
 * @export
 * @interface AuthorizeDetail
 */
export interface AuthorizeDetail {
    /**
     * The authorization amount.
     * @type {number}
     * @memberof AuthorizeDetail
     */
    'amount'?: number;
    /**
     * The authorization code returned by the acquirer or payment method provider.
     * @type {string}
     * @memberof AuthorizeDetail
     */
    'acquirerAuthorizationCode'?: string;
}
/**
 * 
 * @export
 * @interface AuthorizeError
 */
export interface AuthorizeError {
    /**
     * 
     * @type {TransactionsErrorCode}
     * @memberof AuthorizeError
     */
    'code'?: TransactionsErrorCode;
    /**
     * A human readable message indicating what went wrong.
     * @type {string}
     * @memberof AuthorizeError
     */
    'message'?: string;
}
/**
 * 
 * @export
 * @interface AuthorizeRequest
 */
export interface AuthorizeRequest {
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof AuthorizeRequest
     */
    'currency': string;
    /**
     * The merchant\'s reference number. It should be unique for each transaction.
     * @type {string}
     * @memberof AuthorizeRequest
     */
    'refno': string;
    /**
     * Optional customer\'s reference number. Supported by some payment methods or acquirers.
     * @type {string}
     * @memberof AuthorizeRequest
     */
    'refno2'?: string;
    /**
     * Whether to automatically settle the transaction after an authorization or not. If not present with the init request, the settings defined in the dashboard (\'Authorisation / Settlement\' or \'Direct Debit\') will be used. Those settings will only be used for web transactions and not for server to server API calls.
     * @type {boolean}
     * @memberof AuthorizeRequest
     */
    'autoSettle'?: boolean;
    /**
     * 
     * @type {CustomerRequest}
     * @memberof AuthorizeRequest
     */
    'customer'?: CustomerRequest;
    /**
     * 
     * @type {BillingAddress}
     * @memberof AuthorizeRequest
     */
    'billing'?: BillingAddress;
    /**
     * 
     * @type {ShippingAddress}
     * @memberof AuthorizeRequest
     */
    'shipping'?: ShippingAddress;
    /**
     * 
     * @type {OrderRequest}
     * @memberof AuthorizeRequest
     */
    'order'?: OrderRequest;
    /**
     * 
     * @type {CardAuthorizeRequest}
     * @memberof AuthorizeRequest
     */
    'card'?: CardAuthorizeRequest;
    /**
     * 
     * @type {BoncardRequest}
     * @memberof AuthorizeRequest
     */
    'BON'?: BoncardRequest;
    /**
     * 
     * @type {PayPalAuthorizeRequest}
     * @memberof AuthorizeRequest
     */
    'PAP'?: PayPalAuthorizeRequest;
    /**
     * 
     * @type {PfcAuthorizeRequest}
     * @memberof AuthorizeRequest
     */
    'PFC'?: PfcAuthorizeRequest;
    /**
     * 
     * @type {RekaRequest}
     * @memberof AuthorizeRequest
     */
    'REK'?: RekaRequest;
    /**
     * 
     * @type {KlarnaAuthorizeRequest}
     * @memberof AuthorizeRequest
     */
    'KLN'?: KlarnaAuthorizeRequest;
    /**
     * 
     * @type {TwintAuthorizeRequest}
     * @memberof AuthorizeRequest
     */
    'TWI'?: TwintAuthorizeRequest;
    /**
     * 
     * @type {ByjunoAuthorizeRequest}
     * @memberof AuthorizeRequest
     */
    'INT'?: ByjunoAuthorizeRequest;
    /**
     * 
     * @type {ESY}
     * @memberof AuthorizeRequest
     */
    'ESY'?: ESY;
    /**
     * 
     * @type {AirlineDataRequest}
     * @memberof AuthorizeRequest
     */
    'airlineData'?: AirlineDataRequest;
    /**
     * The amount of the transaction in the currency’s smallest unit. For example use 1000 for CHF 10.00. 
     * @type {number}
     * @memberof AuthorizeRequest
     */
    'amount': number;
    /**
     * 
     * @type {AccardaRequest}
     * @memberof AuthorizeRequest
     */
    'ACC'?: AccardaRequest;
    /**
     * 
     * @type {GooglePayRequest}
     * @memberof AuthorizeRequest
     */
    'PAY'?: GooglePayRequest;
    /**
     * 
     * @type {ApplePayRequest}
     * @memberof AuthorizeRequest
     */
    'APL'?: ApplePayRequest;
    /**
     * 
     * @type {MarketPlaceAuthorize}
     * @memberof AuthorizeRequest
     */
    'marketplace'?: MarketPlaceAuthorize;
    /**
     * 
     * @type {SwissBillingAuthorizeRequest}
     * @memberof AuthorizeRequest
     */
    'SWB'?: SwissBillingAuthorizeRequest;
}
/**
 * 
 * @export
 * @interface AuthorizeResponse
 */
export interface AuthorizeResponse {
    /**
     * The transactionId to use for subsequent actions like settlement.
     * @type {string}
     * @memberof AuthorizeResponse
     */
    'transactionId'?: string;
    /**
     * The authorization code returned by the acquirer or payment method provider.
     * @type {string}
     * @memberof AuthorizeResponse
     */
    'acquirerAuthorizationCode'?: string;
}
/**
 * 
 * @export
 * @interface AuthorizeSplitError
 */
export interface AuthorizeSplitError {
    /**
     * 
     * @type {TransactionsErrorCode}
     * @memberof AuthorizeSplitError
     */
    'code'?: TransactionsErrorCode;
    /**
     * A human readable message indicating what went wrong.
     * @type {string}
     * @memberof AuthorizeSplitError
     */
    'message'?: string;
}
/**
 * 
 * @export
 * @interface AuthorizeSplitRequest
 */
export interface AuthorizeSplitRequest {
    /**
     * The amount of the transaction in the currency’s smallest unit. For example use 1000 for CHF 10.00. 
     * @type {number}
     * @memberof AuthorizeSplitRequest
     */
    'amount'?: number;
    /**
     * The merchant\'s reference number. It should be unique for each transaction.
     * @type {string}
     * @memberof AuthorizeSplitRequest
     */
    'refno': string;
    /**
     * Optional customer\'s reference number. Supported by some payment methods or acquirers.
     * @type {string}
     * @memberof AuthorizeSplitRequest
     */
    'refno2'?: string;
    /**
     * Whether to automatically settle the transaction after an authorization or not. If not present with the init request, the settings defined in the dashboard (\'Authorisation / Settlement\' or \'Direct Debit\') will be used. Those settings will only be used for web transactions and not for server to server API calls.
     * @type {boolean}
     * @memberof AuthorizeSplitRequest
     */
    'autoSettle'?: boolean;
    /**
     * CyberSource specific parameters. Use the same properties as you would for direct CyberSource requests.
     * @type {object}
     * @memberof AuthorizeSplitRequest
     */
    'CDM'?: object;
    /**
     * 
     * @type {AuthorizeSplitThreeDSecure}
     * @memberof AuthorizeSplitRequest
     */
    '3D'?: AuthorizeSplitThreeDSecure;
}
/**
 * 
 * @export
 * @interface AuthorizeSplitResponse
 */
export interface AuthorizeSplitResponse {
    /**
     * The authorization code returned by the acquirer or payment method provider.
     * @type {string}
     * @memberof AuthorizeSplitResponse
     */
    'acquirerAuthorizationCode'?: string;
}
/**
 * 3D secure parameters
 * @export
 * @interface AuthorizeSplitThreeDSecure
 */
export interface AuthorizeSplitThreeDSecure {
    /**
     * Decides if the 3D secure process should be applied.
     * @type {boolean}
     * @memberof AuthorizeSplitThreeDSecure
     */
    'apply'?: boolean;
}
/**
 * 
 * @export
 * @interface BillingAddress
 */
export interface BillingAddress {
    /**
     * Gender of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'gender'?: string;
    /**
     * Title of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'title'?: string;
    /**
     * Name of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'name'?: string;
    /**
     * First name of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'firstName'?: string;
    /**
     * Last name of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'lastName'?: string;
    /**
     * Email of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'email'?: string;
    /**
     * Street of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'street'?: string;
    /**
     * Secondary street name of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'street2'?: string;
    /**
     * Postal code of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'zipCode'?: string;
    /**
     * City of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'city'?: string;
    /**
     * <a href=\'https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3\' target=\'_blank\'>ISO 3166-1 alpha-3</a> country code of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'country'?: string;
    /**
     * Country subdivision of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'countrySubdivision'?: string;
    /**
     * The sorting code of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'sortingCode'?: string;
    /**
     * Phone number of the person
     * @type {string}
     * @memberof BillingAddress
     */
    'phoneNumber'?: string;
}
/**
 * Boncard specific request parameters
 * @export
 * @interface BoncardRequest
 */
export interface BoncardRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof BoncardRequest
     */
    'alias': string;
    /**
     * 
     * @type {string}
     * @memberof BoncardRequest
     */
    'cvv'?: string;
}
/**
 * 
 * @export
 * @interface Browser
 */
export interface Browser {
    /**
     * 
     * @type {string}
     * @memberof Browser
     */
    'browserAcceptHeader'?: string;
    /**
     * 
     * @type {string}
     * @memberof Browser
     */
    'browserIP'?: string;
    /**
     * 
     * @type {boolean}
     * @memberof Browser
     */
    'browserJavaEnabled'?: boolean;
    /**
     * 
     * @type {string}
     * @memberof Browser
     */
    'browserLanguage'?: string;
    /**
     * 
     * @type {string}
     * @memberof Browser
     */
    'browserColorDepth'?: BrowserBrowserColorDepthEnum;
    /**
     * 
     * @type {number}
     * @memberof Browser
     */
    'browserScreenHeight'?: number;
    /**
     * 
     * @type {number}
     * @memberof Browser
     */
    'browserScreenWidth'?: number;
    /**
     * 
     * @type {number}
     * @memberof Browser
     */
    'browserTZ'?: number;
    /**
     * 
     * @type {string}
     * @memberof Browser
     */
    'browserUserAgent'?: string;
    /**
     * 
     * @type {string}
     * @memberof Browser
     */
    'challengeWindowSize'?: BrowserChallengeWindowSizeEnum;
    /**
     * 
     * @type {boolean}
     * @memberof Browser
     */
    'browserJavascriptEnabled'?: boolean;
}

export const BrowserBrowserColorDepthEnum = {
    _1: '1',
    _4: '4',
    _8: '8',
    _15: '15',
    _16: '16',
    _24: '24',
    _32: '32',
    _48: '48'
} as const;

export type BrowserBrowserColorDepthEnum = typeof BrowserBrowserColorDepthEnum[keyof typeof BrowserBrowserColorDepthEnum];
export const BrowserChallengeWindowSizeEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04',
    _05: '05'
} as const;

export type BrowserChallengeWindowSizeEnum = typeof BrowserChallengeWindowSizeEnum[keyof typeof BrowserChallengeWindowSizeEnum];

/**
 * 
 * @export
 * @interface BulkSaleReportRequest
 */
export interface BulkSaleReportRequest {
    /**
     * A list of sale objects.
     * @type {Array<SaleReportRequest>}
     * @memberof BulkSaleReportRequest
     */
    'sales'?: Array<SaleReportRequest>;
}
/**
 * Buyer Meta Data
 * @export
 * @interface BuyerMetaData
 */
export interface BuyerMetaData {
    /**
     * The version of BuyerMetaData field (used for tracking schema changes to the field).
     * @type {string}
     * @memberof BuyerMetaData
     */
    'version'?: string;
    /**
     * True if the buyer is purchasing from the merchant for the first time. Else false.
     * @type {boolean}
     * @memberof BuyerMetaData
     */
    'isFirstTimeCustomer'?: boolean;
    /**
     * The number of purchases the buyer has made from the merchant in the past.
     * @type {number}
     * @memberof BuyerMetaData
     */
    'numberOfPastPurchases'?: number;
    /**
     * The number of purchases that has been disputed by the buyer when making purchases from the merchant.
     * @type {number}
     * @memberof BuyerMetaData
     */
    'numberOfDisputedPurchases'?: number;
    /**
     * True if the buyer has an ongoing dispute regarding a past purchase.
     * @type {boolean}
     * @memberof BuyerMetaData
     */
    'hasOpenDispute'?: boolean;
    /**
     * The risk score which the merchant computes for a buyer. The value must be a decimal in the range between 0 (lowest risk) and 1 (highest risk).
     * @type {string}
     * @memberof BuyerMetaData
     */
    'riskScore'?: string;
    /**
     * The user agent of the browser used by the buyer to make the purchase on merchant site. Example: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36.
     * @type {string}
     * @memberof BuyerMetaData
     */
    'userAgent'?: string;
    /**
     * Language in which the buyer is viewing the site at the time of placing the order in \'language-LOCALE\' format example: en-US. Use ISO 639-1:2002 code for the language part (en) and ISO 3166-1 alpha-2 for the LOCALE part (US).
     * @type {string}
     * @memberof BuyerMetaData
     */
    'language'?: string;
    /**
     * True, if the recipient email is exactly the same as the one on the amazon account used for payment, false otherwise.
     * @type {boolean}
     * @memberof BuyerMetaData
     */
    'recipientEmailMatches'?: boolean;
    /**
     * True, if the account holder of the amazon account is actually one of the travelers, false otherwise.
     * @type {boolean}
     * @memberof BuyerMetaData
     */
    'buyerIsATraveler'?: boolean;
}
/**
 * 
 * @export
 * @interface ByjunoAuthorizeRequest
 */
export interface ByjunoAuthorizeRequest {
    /**
     * The Byjuno specific payment method used for the transaction.
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'subtype': ByjunoAuthorizeRequestSubtypeEnum;
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'alias'?: string;
    /**
     * Indicates that the customer has confirmed the email address to the merchant
     * @type {boolean}
     * @memberof ByjunoAuthorizeRequest
     */
    'customerEmailConfirmed'?: boolean;
    /**
     * Customer information for credit check.
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'customerInfo1'?: string;
    /**
     * Customer information for credit check.
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'customerInfo2'?: string;
    /**
     * Can be one of POST (Delivery by Swiss Post), SHOP (Point of Sale) or HLD (Home Delivery Service)
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'deliveryMethod'?: string;
    /**
     * Identification of the customer in the shop
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'deviceFingerprintId'?: string;
    /**
     * Whether or not to send a paper invoice.
     * @type {boolean}
     * @memberof ByjunoAuthorizeRequest
     */
    'paperInvoice'?: boolean;
    /**
     * Number from 1 to 20 to indicate the repayment schedule. This is used in combination with payment methods and defined per client configuration.
     * @type {number}
     * @memberof ByjunoAuthorizeRequest
     */
    'repaymentType'?: number;
    /**
     * Defines which party should take the risk.
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'riskOwner'?: ByjunoAuthorizeRequestRiskOwnerEnum;
    /**
     * Can be used in case when client operates different legally separated stores / points of sale.
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'siteId'?: string;
    /**
     * Indication if merchant is having verified documents from client request.
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'verifiedDocument1Type'?: ByjunoAuthorizeRequestVerifiedDocument1TypeEnum;
    /**
     * Verified document number.
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'verifiedDocument1Number'?: string;
    /**
     * Verified document issuer.
     * @type {string}
     * @memberof ByjunoAuthorizeRequest
     */
    'verifiedDocument1Issuer'?: string;
    /**
     * A list of custom data fields. It can accept up to 10 entries.
     * @type {Array<string>}
     * @memberof ByjunoAuthorizeRequest
     */
    'customData'?: Array<string>;
    /**
     * Amount of the first rate paid by the customer.
     * @type {number}
     * @memberof ByjunoAuthorizeRequest
     */
    'firstRateAmount'?: number;
}

export const ByjunoAuthorizeRequestSubtypeEnum = {
    Invoice: 'INVOICE',
    Installment: 'INSTALLMENT',
    ByjunoInvoice: 'BYJUNO-INVOICE',
    Monthlyinvoice: 'MONTHLYINVOICE'
} as const;

export type ByjunoAuthorizeRequestSubtypeEnum = typeof ByjunoAuthorizeRequestSubtypeEnum[keyof typeof ByjunoAuthorizeRequestSubtypeEnum];
export const ByjunoAuthorizeRequestRiskOwnerEnum = {
    Ij: 'IJ',
    Client: 'CLIENT'
} as const;

export type ByjunoAuthorizeRequestRiskOwnerEnum = typeof ByjunoAuthorizeRequestRiskOwnerEnum[keyof typeof ByjunoAuthorizeRequestRiskOwnerEnum];
export const ByjunoAuthorizeRequestVerifiedDocument1TypeEnum = {
    SwissTravelPass: 'swiss-travel-pass',
    Other: 'other'
} as const;

export type ByjunoAuthorizeRequestVerifiedDocument1TypeEnum = typeof ByjunoAuthorizeRequestVerifiedDocument1TypeEnum[keyof typeof ByjunoAuthorizeRequestVerifiedDocument1TypeEnum];

/**
 * If INT was used for a transaction the object holds all Byjuno relevant properties.
 * @export
 * @interface ByjunoDetail
 */
export interface ByjunoDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof ByjunoDetail
     */
    'alias'?: string;
}
/**
 * 
 * @export
 * @interface ByjunoScreenRequest
 */
export interface ByjunoScreenRequest {
    /**
     * The Byjuno specific payment method used for the transaction.
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'subtype': ByjunoScreenRequestSubtypeEnum;
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'alias'?: string;
    /**
     * Indicates that the customer has confirmed the email address to the merchant
     * @type {boolean}
     * @memberof ByjunoScreenRequest
     */
    'customerEmailConfirmed'?: boolean;
    /**
     * Customer information for credit check.
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'customerInfo1'?: string;
    /**
     * Customer information for credit check.
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'customerInfo2'?: string;
    /**
     * Can be one of POST (Delivery by Swiss Post), SHOP (Point of Sale) or HLD (Home Delivery Service)
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'deliveryMethod'?: string;
    /**
     * Identification of the customer in the shop
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'deviceFingerprintId'?: string;
    /**
     * Whether or not to send a paper invoice.
     * @type {boolean}
     * @memberof ByjunoScreenRequest
     */
    'paperInvoice'?: boolean;
    /**
     * Number from 1 to 20 to indicate the repayment schedule. This is used in combination with payment methods and defined per client configuration.
     * @type {number}
     * @memberof ByjunoScreenRequest
     */
    'repaymentType'?: number;
    /**
     * Defines which party should take the risk.
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'riskOwner'?: ByjunoScreenRequestRiskOwnerEnum;
    /**
     * Can be used in case when client operates different legally separated stores / points of sale.
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'siteId'?: string;
    /**
     * Indication if merchant is having verified documents from client request.
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'verifiedDocument1Type'?: ByjunoScreenRequestVerifiedDocument1TypeEnum;
    /**
     * Verified document number.
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'verifiedDocument1Number'?: string;
    /**
     * Verified document issuer.
     * @type {string}
     * @memberof ByjunoScreenRequest
     */
    'verifiedDocument1Issuer'?: string;
    /**
     * A list of custom data fields. It can accept up to 10 entries.
     * @type {Array<string>}
     * @memberof ByjunoScreenRequest
     */
    'customData'?: Array<string>;
    /**
     * Amount of the first rate paid by the customer.
     * @type {number}
     * @memberof ByjunoScreenRequest
     */
    'firstRateAmount'?: number;
}

export const ByjunoScreenRequestSubtypeEnum = {
    Invoice: 'INVOICE',
    Installment: 'INSTALLMENT',
    ByjunoInvoice: 'BYJUNO-INVOICE',
    Monthlyinvoice: 'MONTHLYINVOICE'
} as const;

export type ByjunoScreenRequestSubtypeEnum = typeof ByjunoScreenRequestSubtypeEnum[keyof typeof ByjunoScreenRequestSubtypeEnum];
export const ByjunoScreenRequestRiskOwnerEnum = {
    Ij: 'IJ',
    Client: 'CLIENT'
} as const;

export type ByjunoScreenRequestRiskOwnerEnum = typeof ByjunoScreenRequestRiskOwnerEnum[keyof typeof ByjunoScreenRequestRiskOwnerEnum];
export const ByjunoScreenRequestVerifiedDocument1TypeEnum = {
    SwissTravelPass: 'swiss-travel-pass',
    Other: 'other'
} as const;

export type ByjunoScreenRequestVerifiedDocument1TypeEnum = typeof ByjunoScreenRequestVerifiedDocument1TypeEnum[keyof typeof ByjunoScreenRequestVerifiedDocument1TypeEnum];

/**
 * 
 * @export
 * @interface CancelDetail
 */
export interface CancelDetail {
    /**
     * Whether the transaction was reversed on acquirer side.
     * @type {boolean}
     * @memberof CancelDetail
     */
    'reversal'?: boolean;
}
/**
 * 
 * @export
 * @interface CancelRequest
 */
export interface CancelRequest {
    /**
     * The merchant\'s reference number. It should be unique for each transaction.
     * @type {string}
     * @memberof CancelRequest
     */
    'refno': string;
}
/**
 * The card object to be submitted when authorizing with an existing credit card alias.
 * @export
 * @interface CardAuthorizeRequest
 */
export interface CardAuthorizeRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof CardAuthorizeRequest
     */
    'alias'?: string;
    /**
     * The expiry month of the credit card alias.
     * @type {string}
     * @memberof CardAuthorizeRequest
     */
    'expiryMonth'?: string;
    /**
     * The expiry year of the credit card alias
     * @type {string}
     * @memberof CardAuthorizeRequest
     */
    'expiryYear'?: string;
    /**
     * 
     * @type {EMVCo3DAuthenticationDataAuthorizeRequest}
     * @memberof CardAuthorizeRequest
     */
    '3D'?: EMVCo3DAuthenticationDataAuthorizeRequest;
}
/**
 * If a credit card payment method was used for a transaction the `card` object holds all relevant properties for the used card.
 * @export
 * @interface CardDetail
 */
export interface CardDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof CardDetail
     */
    'alias'?: string;
    /**
     * An unique identifier of the card number. Useful to identify multiple customers\' or the same customer\'s transactions where the same card was used.
     * @type {string}
     * @memberof CardDetail
     */
    'fingerprint'?: string;
    /**
     * Masked credit card number. Can be used to display on a users profile page. For example: `424242xxxxxx4242`
     * @type {string}
     * @memberof CardDetail
     */
    'masked'?: string;
    /**
     * Alias of the CVV. Will be deleted immediately after authorization.
     * @type {string}
     * @memberof CardDetail
     */
    'aliasCVV'?: string;
    /**
     * The expiry month of the credit card alias.
     * @type {string}
     * @memberof CardDetail
     */
    'expiryMonth'?: string;
    /**
     * The expiry year of the credit card alias
     * @type {string}
     * @memberof CardDetail
     */
    'expiryYear'?: string;
    /**
     * 
     * @type {CardInfo}
     * @memberof CardDetail
     */
    'info'?: CardInfo;
    /**
     * 
     * @type {string}
     * @memberof CardDetail
     */
    'walletIndicator'?: CardDetailWalletIndicatorEnum;
    /**
     * 
     * @type {EMVCo3DAuthenticationDataStatusResponse}
     * @memberof CardDetail
     */
    '3D'?: EMVCo3DAuthenticationDataStatusResponse;
}

export const CardDetailWalletIndicatorEnum = {
    Apl: 'APL',
    Pay: 'PAY',
    Sam: 'SAM'
} as const;

export type CardDetailWalletIndicatorEnum = typeof CardDetailWalletIndicatorEnum[keyof typeof CardDetailWalletIndicatorEnum];

/**
 * The card information if the request was done with a card object
 * @export
 * @interface CardInfo
 */
export interface CardInfo {
    /**
     * The brand of the credit card (e.g. VISA CREDIT).
     * @type {string}
     * @memberof CardInfo
     */
    'brand'?: string;
    /**
     * The type of the card (`credit`, `debit` or `prepaid`). The property will not be present if the card type is unknown.
     * @type {string}
     * @memberof CardInfo
     */
    'type'?: string;
    /**
     * The usage of the card (`consumer`, `corporate` or `unknown`)
     * @type {string}
     * @memberof CardInfo
     */
    'usage'?: string;
    /**
     * 2 letter ISO 3166-1 alpha-2 country code
     * @type {string}
     * @memberof CardInfo
     */
    'country'?: string;
    /**
     * The issuer of the card
     * @type {string}
     * @memberof CardInfo
     */
    'issuer'?: string;
}
/**
 * The card object to be submitted when initializing a transaction with an existing alias. The inner `3D` object can be used to submit all mandatory, conditional and optional 3D 2.0 parameters.
 * @export
 * @interface CardInitRequest
 */
export interface CardInitRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof CardInitRequest
     */
    'alias'?: string;
    /**
     * The expiry month of the credit card alias.
     * @type {string}
     * @memberof CardInitRequest
     */
    'expiryMonth'?: string;
    /**
     * The expiry year of the credit card alias
     * @type {string}
     * @memberof CardInitRequest
     */
    'expiryYear'?: string;
    /**
     * Specifies whether a CVV alias should be created
     * @type {boolean}
     * @memberof CardInitRequest
     */
    'createAliasCVV'?: boolean;
    /**
     * 
     * @type {CardInitThreeDSecure}
     * @memberof CardInitRequest
     */
    '3D'?: CardInitThreeDSecure;
}
/**
 * Refer to the official <a href=\'https://www.emvco.com/wp-content/plugins/pmpro-customizations/oy-getfile.php?u=/wp-content/uploads/documents/EMVCo_3DS_Spec_210_1017_0318.pdf\' target=\'_blank\'>EMVCo 3D specification 2.1.0</a> for parameter requirements.
 * @export
 * @interface CardInitThreeDSecure
 */
export interface CardInitThreeDSecure {
    /**
     * 
     * @type {ThreeDSRequestor}
     * @memberof CardInitThreeDSecure
     */
    'threeDSRequestor'?: ThreeDSRequestor;
    /**
     * 
     * @type {string}
     * @memberof CardInitThreeDSecure
     */
    'threeDSRequestorURL'?: string;
    /**
     * 
     * @type {CardholderAccount}
     * @memberof CardInitThreeDSecure
     */
    'cardholderAccount'?: CardholderAccount;
    /**
     * 
     * @type {Cardholder}
     * @memberof CardInitThreeDSecure
     */
    'cardholder'?: Cardholder;
    /**
     * 
     * @type {Purchase}
     * @memberof CardInitThreeDSecure
     */
    'purchase'?: Purchase;
    /**
     * 
     * @type {MerchantData}
     * @memberof CardInitThreeDSecure
     */
    'merchant'?: MerchantData;
    /**
     * 
     * @type {string}
     * @memberof CardInitThreeDSecure
     */
    'broadInfo'?: string;
    /**
     * 
     * @type {Browser}
     * @memberof CardInitThreeDSecure
     */
    'browserInformation'?: Browser;
    /**
     * 
     * @type {string}
     * @memberof CardInitThreeDSecure
     */
    'threeRIInd'?: CardInitThreeDSecureThreeRIIndEnum;
    /**
     * Decides if the 3D secure process should be applied.
     * @type {boolean}
     * @memberof CardInitThreeDSecure
     */
    'apply'?: boolean;
}

export const CardInitThreeDSecureThreeRIIndEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04',
    _05: '05'
} as const;

export type CardInitThreeDSecureThreeRIIndEnum = typeof CardInitThreeDSecureThreeRIIndEnum[keyof typeof CardInitThreeDSecureThreeRIIndEnum];

/**
 * The card object to be submitted when validating with an existing credit card alias.
 * @export
 * @interface CardValidateRequest
 */
export interface CardValidateRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof CardValidateRequest
     */
    'alias'?: string;
    /**
     * The expiry month of the credit card alias.
     * @type {string}
     * @memberof CardValidateRequest
     */
    'expiryMonth'?: string;
    /**
     * The expiry year of the credit card alias
     * @type {string}
     * @memberof CardValidateRequest
     */
    'expiryYear'?: string;
    /**
     * 
     * @type {EMVCo3DAuthenticationDataAuthorizeRequest}
     * @memberof CardValidateRequest
     */
    '3D'?: EMVCo3DAuthenticationDataAuthorizeRequest;
}
/**
 * 
 * @export
 * @interface Cardholder
 */
export interface Cardholder {
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'addrMatch'?: CardholderAddrMatchEnum;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'billAddrCity'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'billAddrCountry'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'billAddrLine1'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'billAddrLine2'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'billAddrLine3'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'billAddrPostCode'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'billAddrState'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'email'?: string;
    /**
     * 
     * @type {CardholderPhoneNumber}
     * @memberof Cardholder
     */
    'homePhone'?: CardholderPhoneNumber;
    /**
     * 
     * @type {CardholderPhoneNumber}
     * @memberof Cardholder
     */
    'mobilePhone'?: CardholderPhoneNumber;
    /**
     * 
     * @type {CardholderPhoneNumber}
     * @memberof Cardholder
     */
    'workPhone'?: CardholderPhoneNumber;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'cardholderName'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'shipAddrCity'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'shipAddrCountry'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'shipAddrLine1'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'shipAddrLine2'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'shipAddrLine3'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'shipAddrPostCode'?: string;
    /**
     * 
     * @type {string}
     * @memberof Cardholder
     */
    'shipAddrState'?: string;
}

export const CardholderAddrMatchEnum = {
    Y: 'Y',
    N: 'N'
} as const;

export type CardholderAddrMatchEnum = typeof CardholderAddrMatchEnum[keyof typeof CardholderAddrMatchEnum];

/**
 * 
 * @export
 * @interface CardholderAccount
 */
export interface CardholderAccount {
    /**
     * 
     * @type {string}
     * @memberof CardholderAccount
     */
    'cardExpiryDate'?: string;
    /**
     * 
     * @type {CardholderAccountInformation}
     * @memberof CardholderAccount
     */
    'acctInfo'?: CardholderAccountInformation;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccount
     */
    'acctID'?: string;
}
/**
 * 
 * @export
 * @interface CardholderAccountInformation
 */
export interface CardholderAccountInformation {
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'chAccDate'?: string;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'chAccChangeInd'?: CardholderAccountInformationChAccChangeIndEnum;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'chAccChange'?: string;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'chAccPwChangeInd'?: CardholderAccountInformationChAccPwChangeIndEnum;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'chAccPwChange'?: string;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'shipAddressUsageInd'?: CardholderAccountInformationShipAddressUsageIndEnum;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'shipAddressUsage'?: string;
    /**
     * 
     * @type {number}
     * @memberof CardholderAccountInformation
     */
    'txnActivityDay'?: number;
    /**
     * 
     * @type {number}
     * @memberof CardholderAccountInformation
     */
    'txnActivityYear'?: number;
    /**
     * 
     * @type {number}
     * @memberof CardholderAccountInformation
     */
    'provisionAttemptsDay'?: number;
    /**
     * 
     * @type {number}
     * @memberof CardholderAccountInformation
     */
    'nbPurchaseAccount'?: number;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'suspiciousAccActivity'?: CardholderAccountInformationSuspiciousAccActivityEnum;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'shipNameIndicator'?: CardholderAccountInformationShipNameIndicatorEnum;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'paymentAccInd'?: CardholderAccountInformationPaymentAccIndEnum;
    /**
     * 
     * @type {string}
     * @memberof CardholderAccountInformation
     */
    'paymentAccAge'?: string;
}

export const CardholderAccountInformationChAccChangeIndEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04'
} as const;

export type CardholderAccountInformationChAccChangeIndEnum = typeof CardholderAccountInformationChAccChangeIndEnum[keyof typeof CardholderAccountInformationChAccChangeIndEnum];
export const CardholderAccountInformationChAccPwChangeIndEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04',
    _05: '05'
} as const;

export type CardholderAccountInformationChAccPwChangeIndEnum = typeof CardholderAccountInformationChAccPwChangeIndEnum[keyof typeof CardholderAccountInformationChAccPwChangeIndEnum];
export const CardholderAccountInformationShipAddressUsageIndEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04'
} as const;

export type CardholderAccountInformationShipAddressUsageIndEnum = typeof CardholderAccountInformationShipAddressUsageIndEnum[keyof typeof CardholderAccountInformationShipAddressUsageIndEnum];
export const CardholderAccountInformationSuspiciousAccActivityEnum = {
    _01: '01',
    _02: '02'
} as const;

export type CardholderAccountInformationSuspiciousAccActivityEnum = typeof CardholderAccountInformationSuspiciousAccActivityEnum[keyof typeof CardholderAccountInformationSuspiciousAccActivityEnum];
export const CardholderAccountInformationShipNameIndicatorEnum = {
    _01: '01',
    _02: '02'
} as const;

export type CardholderAccountInformationShipNameIndicatorEnum = typeof CardholderAccountInformationShipNameIndicatorEnum[keyof typeof CardholderAccountInformationShipNameIndicatorEnum];
export const CardholderAccountInformationPaymentAccIndEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04',
    _05: '05'
} as const;

export type CardholderAccountInformationPaymentAccIndEnum = typeof CardholderAccountInformationPaymentAccIndEnum[keyof typeof CardholderAccountInformationPaymentAccIndEnum];

/**
 * 
 * @export
 * @interface CardholderPhoneNumber
 */
export interface CardholderPhoneNumber {
    /**
     * 
     * @type {string}
     * @memberof CardholderPhoneNumber
     */
    'cc'?: string;
    /**
     * 
     * @type {string}
     * @memberof CardholderPhoneNumber
     */
    'subscriber'?: string;
}
/**
 * 
 * @export
 * @interface CreditDetail
 */
export interface CreditDetail {
    /**
     * The credit amount.
     * @type {number}
     * @memberof CreditDetail
     */
    'amount'?: number;
}
/**
 * 
 * @export
 * @interface CreditError
 */
export interface CreditError {
    /**
     * 
     * @type {TransactionsErrorCode}
     * @memberof CreditError
     */
    'code'?: TransactionsErrorCode;
    /**
     * A human readable message indicating what went wrong.
     * @type {string}
     * @memberof CreditError
     */
    'message'?: string;
    /**
     * 
     * @type {string}
     * @memberof CreditError
     */
    'transactionId'?: string;
}
/**
 * 
 * @export
 * @interface CreditRequest
 */
export interface CreditRequest {
    /**
     * The amount of the transaction in the currency’s smallest unit. For example use 1000 for CHF 10.00. 
     * @type {number}
     * @memberof CreditRequest
     */
    'amount'?: number;
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof CreditRequest
     */
    'currency': string;
    /**
     * The merchant\'s reference number. It should be unique for each transaction.
     * @type {string}
     * @memberof CreditRequest
     */
    'refno': string;
    /**
     * Optional customer\'s reference number. Supported by some payment methods or acquirers.
     * @type {string}
     * @memberof CreditRequest
     */
    'refno2'?: string;
    /**
     * 
     * @type {MarketPlaceCredit}
     * @memberof CreditRequest
     */
    'marketplace'?: MarketPlaceCredit;
    /**
     * An object for additional data needed by some merchants for customized processes.
     * @type {object}
     * @memberof CreditRequest
     */
    'extensions'?: object;
}
/**
 * 
 * @export
 * @interface CreditResponse
 */
export interface CreditResponse {
    /**
     * When a credit is performed, a new `transactionId` is created
     * @type {string}
     * @memberof CreditResponse
     */
    'transactionId'?: string;
    /**
     * The authorization code returned by the acquirer or payment method provider.
     * @type {string}
     * @memberof CreditResponse
     */
    'acquirerAuthorizationCode'?: string;
}
/**
 * Customer details. Returned only if collected by the payment page. Setup dependent.
 * @export
 * @interface Customer
 */
export interface Customer {
    /**
     * The email of the customer.
     * @type {string}
     * @memberof Customer
     */
    'email'?: string;
    /**
     * The full name of the customer.
     * @type {string}
     * @memberof Customer
     */
    'name'?: string;
    /**
     * The first name of the customer.
     * @type {string}
     * @memberof Customer
     */
    'firstName'?: string;
    /**
     * The last name of the customer.
     * @type {string}
     * @memberof Customer
     */
    'lastName'?: string;
    /**
     * The street of the customer.
     * @type {string}
     * @memberof Customer
     */
    'street'?: string;
    /**
     * The city of the customer.
     * @type {string}
     * @memberof Customer
     */
    'city'?: string;
    /**
     * 2 letter ISO 3166-1 alpha-2 country code
     * @type {string}
     * @memberof Customer
     */
    'country'?: string;
    /**
     * Zip code of the customer.
     * @type {string}
     * @memberof Customer
     */
    'zipCode'?: string;
}
/**
 * Whenever the payment method supports `customer` details, the customer object can be used. If a particular field is required varies from payment method to payment method. For example the field `birthDate` is not mandatory for each payment method supporting the `customer` object.
 * @export
 * @interface CustomerRequest
 */
export interface CustomerRequest {
    /**
     * Unique customer identifier
     * @type {string}
     * @memberof CustomerRequest
     */
    'id'?: string;
    /**
     * Something like `Ms` or `Mrs`
     * @type {string}
     * @memberof CustomerRequest
     */
    'title'?: string;
    /**
     * The first name of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'firstName'?: string;
    /**
     * The last name of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'lastName'?: string;
    /**
     * The street of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'street'?: string;
    /**
     * Additional street information. For example: \'3rd floor\'
     * @type {string}
     * @memberof CustomerRequest
     */
    'street2'?: string;
    /**
     * The city of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'city'?: string;
    /**
     * 2 letter ISO 3166-1 alpha-2 country code
     * @type {string}
     * @memberof CustomerRequest
     */
    'country'?: string;
    /**
     * Zip code of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'zipCode'?: string;
    /**
     * Phone number of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'phone'?: string;
    /**
     * Cell Phone number of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'cellPhone'?: string;
    /**
     * The email address of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'email'?: string;
    /**
     * Gender of the customer. `female` or `male`.
     * @type {string}
     * @memberof CustomerRequest
     */
    'gender'?: string;
    /**
     * The birth date of the customer. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (`YYYY-MM-DD`).
     * @type {string}
     * @memberof CustomerRequest
     */
    'birthDate'?: string;
    /**
     * The language of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'language'?: string;
    /**
     * `P` or `C` depending on whether the customer is private or a company. If `C`, the fields `name` and `companyRegisterNumber` are required
     * @type {string}
     * @memberof CustomerRequest
     */
    'type'?: string;
    /**
     * The name of the company. Only applicable if `type=C`
     * @type {string}
     * @memberof CustomerRequest
     */
    'name'?: string;
    /**
     * The legal form of the company (AG, GmbH, ...)
     * @type {string}
     * @memberof CustomerRequest
     */
    'companyLegalForm'?: string;
    /**
     * The register number of the company. Only applicable if `type=C`
     * @type {string}
     * @memberof CustomerRequest
     */
    'companyRegisterNumber'?: string;
    /**
     * The ip address of the customer.
     * @type {string}
     * @memberof CustomerRequest
     */
    'ipAddress'?: string;
}
/**
 * DCC (Dynamic Currency Conversion) data if available.
 * @export
 * @interface Dcc
 */
export interface Dcc {
    /**
     * The DCC currency
     * @type {string}
     * @memberof Dcc
     */
    'currency'?: string;
    /**
     * The DCC amount
     * @type {number}
     * @memberof Dcc
     */
    'amount'?: number;
    /**
     * The DCC rate
     * @type {number}
     * @memberof Dcc
     */
    'rate'?: number;
    /**
     * The DCC markup
     * @type {number}
     * @memberof Dcc
     */
    'markup'?: number;
}
/**
 * Details about the various action steps of the transaction.
 * @export
 * @interface Detail
 */
export interface Detail {
    /**
     * 
     * @type {InitDetail}
     * @memberof Detail
     */
    'init'?: InitDetail;
    /**
     * 
     * @type {AuthorizeDetail}
     * @memberof Detail
     */
    'authorize'?: AuthorizeDetail;
    /**
     * 
     * @type {SettleDetail}
     * @memberof Detail
     */
    'settle'?: SettleDetail;
    /**
     * 
     * @type {CreditDetail}
     * @memberof Detail
     */
    'credit'?: CreditDetail;
    /**
     * 
     * @type {CancelDetail}
     * @memberof Detail
     */
    'cancel'?: CancelDetail;
    /**
     * 
     * @type {FailDetail}
     * @memberof Detail
     */
    'fail'?: FailDetail;
}
/**
 * If 3D authentication data is available, the `3D` object can be used to send the relevant 3D parameters. Please get in contact with us if you have a dedicated 3D provider.
 * @export
 * @interface EMVCo3DAuthenticationDataAuthorizeRequest
 */
export interface EMVCo3DAuthenticationDataAuthorizeRequest {
    /**
     * The Electronic Commerce Indicator
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataAuthorizeRequest
     */
    'eci'?: EMVCo3DAuthenticationDataAuthorizeRequestEciEnum;
    /**
     * The transaction ID returned by the directory server
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataAuthorizeRequest
     */
    'xid'?: string;
    /**
     * The transaction ID returned by the 3D Secure Provider
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataAuthorizeRequest
     */
    'threeDSTransactionId'?: string;
    /**
     * The Cardholder Authentication Verification Value
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataAuthorizeRequest
     */
    'cavv'?: string;
    /**
     * The 3D version
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataAuthorizeRequest
     */
    'threeDSVersion'?: string;
    /**
     * The 3D algorithm
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataAuthorizeRequest
     */
    'cavvAlgorithm'?: string;
    /**
     * Transaction status after `ARes`  |Value|3Dv1|3Dv2| |:---|:---|:---| |Y| enrolled| authenticated| |N| not enrolled| authentication failed| |U| not available| not available| |C| |challenge needed| |R| |rejected| |A| |authentication attempt|  
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataAuthorizeRequest
     */
    'directoryResponse'?: EMVCo3DAuthenticationDataAuthorizeRequestDirectoryResponseEnum;
    /**
     * Transaction status after `RReq` (Challenge flow)  |Value|3Dv1|3Dv2| |:---|:---|:---| |Y| authenticated| authenticated| |N| authentication failed| authentication failed| |U| not available| not available| |A| authentication attempt| authentication attempt| |C| process incomplete| process incomplete| |D| not enrolled| |  
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataAuthorizeRequest
     */
    'authenticationResponse'?: EMVCo3DAuthenticationDataAuthorizeRequestAuthenticationResponseEnum;
}

export const EMVCo3DAuthenticationDataAuthorizeRequestEciEnum = {
    _01: '01',
    _02: '02',
    _05: '05',
    _06: '06',
    _07: '07'
} as const;

export type EMVCo3DAuthenticationDataAuthorizeRequestEciEnum = typeof EMVCo3DAuthenticationDataAuthorizeRequestEciEnum[keyof typeof EMVCo3DAuthenticationDataAuthorizeRequestEciEnum];
export const EMVCo3DAuthenticationDataAuthorizeRequestDirectoryResponseEnum = {
    Y: 'Y',
    N: 'N',
    U: 'U',
    C: 'C',
    R: 'R',
    A: 'A'
} as const;

export type EMVCo3DAuthenticationDataAuthorizeRequestDirectoryResponseEnum = typeof EMVCo3DAuthenticationDataAuthorizeRequestDirectoryResponseEnum[keyof typeof EMVCo3DAuthenticationDataAuthorizeRequestDirectoryResponseEnum];
export const EMVCo3DAuthenticationDataAuthorizeRequestAuthenticationResponseEnum = {
    Y: 'Y',
    N: 'N',
    U: 'U',
    A: 'A',
    C: 'C',
    D: 'D'
} as const;

export type EMVCo3DAuthenticationDataAuthorizeRequestAuthenticationResponseEnum = typeof EMVCo3DAuthenticationDataAuthorizeRequestAuthenticationResponseEnum[keyof typeof EMVCo3DAuthenticationDataAuthorizeRequestAuthenticationResponseEnum];

/**
 * 3D authentication data, if available
 * @export
 * @interface EMVCo3DAuthenticationDataStatusResponse
 */
export interface EMVCo3DAuthenticationDataStatusResponse {
    /**
     * The Electronic Commerce Indicator
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'eci'?: EMVCo3DAuthenticationDataStatusResponseEciEnum;
    /**
     * The transaction ID returned by the directory server
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'xid'?: string;
    /**
     * The transaction ID returned by the 3D Secure Provider
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'threeDSTransactionId'?: string;
    /**
     * The Cardholder Authentication Verification Value
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'cavv'?: string;
    /**
     * The 3D version
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'threeDSVersion'?: string;
    /**
     * The 3D algorithm
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'cavvAlgorithm'?: string;
    /**
     * Transaction status after `ARes`  |Value|3Dv1|3Dv2| |:---|:---|:---| |Y| enrolled| authenticated| |N| not enrolled| authentication failed| |U| not available| not available| |C| |challenge needed| |R| |rejected| |A| |authentication attempt|  
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'directoryResponse'?: EMVCo3DAuthenticationDataStatusResponseDirectoryResponseEnum;
    /**
     * Transaction status after `RReq` (Challenge flow)  |Value|3Dv1|3Dv2| |:---|:---|:---| |Y| authenticated| authenticated| |N| authentication failed| authentication failed| |U| not available| not available| |A| authentication attempt| authentication attempt| |C| process incomplete| process incomplete| |D| not enrolled| |  
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'authenticationResponse'?: EMVCo3DAuthenticationDataStatusResponseAuthenticationResponseEnum;
    /**
     * Text provided by the ACS/Issuer to Cardholder during a transaction that was not authenticated by the ACS. The Issuer can optionally provide information to Cardholder. For example, \"Additional authentication is needed for this transaction, please contact (Issuer Name) at xxx-xxx-xxxx.\"
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'cardHolderInfo'?: string;
    /**
     * Transaction status reason  |Value|Description| |:---|:---| |01| Card authentication failed| |02| Unknown Device| |03| Unsupported Device| |04| Exceeds authentication frequency limit| |05| Expired card| |06| Invalid card number| |07| Invalid transaction| |08| No Card record| |09| Security failure| |10| Stolen card| |11| Suspected fraud| |12| Transaction not permitted to cardholder| |13| Cardholder not enrolled in service| |14| Transaction timed out at the ACS| |15| Low confidence| |16| Medium confidence| |17| High confidence| |18| Very High confidence| |19| Exceeds ACS maximum challenges| |20| Non-Payment transaction not supported| |21| 3RI transaction not supported| |22| ACS technical issue| |23| Decoupled Authentication required by ACS but not requested by 3DS Requestor| |24| 3DS Requestor Decoupled Max Expiry Time exceeded| |25| Decoupled Authentication was provided insufficient time to authenticate cardholder. ACS will not make attempt| |26| Authentication attempted but not performed by the cardholder| |27–79| Reserved for EMVCo future use (values invalid until defined by EMVCo)| |80–99 | Reserved for DS use| 
     * @type {string}
     * @memberof EMVCo3DAuthenticationDataStatusResponse
     */
    'transStatusReason'?: string;
}

export const EMVCo3DAuthenticationDataStatusResponseEciEnum = {
    _01: '01',
    _02: '02',
    _05: '05',
    _06: '06',
    _07: '07'
} as const;

export type EMVCo3DAuthenticationDataStatusResponseEciEnum = typeof EMVCo3DAuthenticationDataStatusResponseEciEnum[keyof typeof EMVCo3DAuthenticationDataStatusResponseEciEnum];
export const EMVCo3DAuthenticationDataStatusResponseDirectoryResponseEnum = {
    Y: 'Y',
    N: 'N',
    U: 'U',
    C: 'C',
    R: 'R',
    A: 'A'
} as const;

export type EMVCo3DAuthenticationDataStatusResponseDirectoryResponseEnum = typeof EMVCo3DAuthenticationDataStatusResponseDirectoryResponseEnum[keyof typeof EMVCo3DAuthenticationDataStatusResponseDirectoryResponseEnum];
export const EMVCo3DAuthenticationDataStatusResponseAuthenticationResponseEnum = {
    Y: 'Y',
    N: 'N',
    U: 'U',
    A: 'A',
    C: 'C',
    D: 'D'
} as const;

export type EMVCo3DAuthenticationDataStatusResponseAuthenticationResponseEnum = typeof EMVCo3DAuthenticationDataStatusResponseAuthenticationResponseEnum[keyof typeof EMVCo3DAuthenticationDataStatusResponseAuthenticationResponseEnum];

/**
 * 
 * @export
 * @interface ESY
 */
export interface ESY {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof ESY
     */
    'alias'?: string;
    /**
     * A description of the purchase.
     * @type {string}
     * @memberof ESY
     */
    'description'?: string;
    /**
     * The payment info of the service (also known as billing text). NOTE: The paymentInfo will be placed on the end user invoice bill.
     * @type {string}
     * @memberof ESY
     */
    'paymentInfo'?: string;
    /**
     * The title on top of the Swisscom Pay Payment Page.
     * @type {string}
     * @memberof ESY
     */
    'title'?: string;
}
/**
 * Swisscom Pay specific parameters
 * @export
 * @interface EasyPayValidateRequest
 */
export interface EasyPayValidateRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof EasyPayValidateRequest
     */
    'alias'?: string;
}
/**
 * If ELV was used for a transaction the object holds all ELV relevant properties.
 * @export
 * @interface ElvDetail
 */
export interface ElvDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof ElvDetail
     */
    'alias'?: string;
}
/**
 * EP2 data if available.
 * @export
 * @interface Ep2
 */
export interface Ep2 {
    /**
     * The terminal ID
     * @type {string}
     * @memberof Ep2
     */
    'trmID'?: string;
    /**
     * The transaction Sequence Count
     * @type {string}
     * @memberof Ep2
     */
    'trxSeqCnt'?: string;
    /**
     * The application Identifier
     * @type {string}
     * @memberof Ep2
     */
    'aid'?: string;
    /**
     * The authorized amount
     * @type {string}
     * @memberof Ep2
     */
    'amtAuth'?: string;
    /**
     * The date of the processing
     * @type {string}
     * @memberof Ep2
     */
    'trxDate'?: string;
    /**
     * The time of the processing
     * @type {string}
     * @memberof Ep2
     */
    'trxTime'?: string;
    /**
     * The PAN
     * @type {string}
     * @memberof Ep2
     */
    'pan'?: string;
    /**
     * The encrypted cardholder account number
     * @type {string}
     * @memberof Ep2
     */
    'appPanEnc'?: string;
    /**
     * The issuer code
     * @type {string}
     * @memberof Ep2
     */
    'issuerCode'?: string;
    /**
     * The activation sequence count
     * @type {number}
     * @memberof Ep2
     */
    'actSeqCnt'?: number;
    /**
     * The transaction reference number
     * @type {string}
     * @memberof Ep2
     */
    'trxRefNum'?: string;
    /**
     * The transaction type extension
     * @type {string}
     * @memberof Ep2
     */
    'trxTypeExt'?: string;
    /**
     * The brand
     * @type {string}
     * @memberof Ep2
     */
    'brand'?: string;
    /**
     * The authorization code
     * @type {string}
     * @memberof Ep2
     */
    'authCode'?: string;
    /**
     * The static key index
     * @type {string}
     * @memberof Ep2
     */
    'staticKeyIndex'?: string;
    /**
     * The transaction currency code
     * @type {string}
     * @memberof Ep2
     */
    'trxCurrC'?: string;
}
/**
 * EPS specific request parameters
 * @export
 * @interface EpsRequest
 */
export interface EpsRequest {
    /**
     * Identification of the customer’s (buyer’s) financial institution by a BIC.
     * @type {string}
     * @memberof EpsRequest
     */
    'bankbic'?: string;
    /**
     * Text between the beneficiary/merchant and the buyer which will not be part of the payment instruction. If submitted, the final orderInfoText will be: `refno + \' \' + orderInfoText`
     * @type {string}
     * @memberof EpsRequest
     */
    'orderInfoText'?: string;
}
/**
 * Bank account details returned if `invoiceOnDelivery` was set in the init request.
 * @export
 * @interface EsrData
 */
export interface EsrData {
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'bankName'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'bankAddress'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'beneficiaryFirstLine'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'beneficiarySecondLine'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'beneficiaryThirdLine'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'beneficiaryFourthLine'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'bankAccount'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'payerFirstLine'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'payerSecondLine'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'payerThirdLine'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'payerFourthLine'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'referenceLine1'?: string;
    /**
     * 
     * @type {string}
     * @memberof EsrData
     */
    'referenceLine2'?: string;
}
/**
 * 
 * @export
 * @interface FailDetail
 */
export interface FailDetail {
    /**
     * The failure reason if an error occurred.
     * @type {string}
     * @memberof FailDetail
     */
    'reason'?: FailDetailReasonEnum;
    /**
     * A detailed message describing the occurred error.
     * @type {string}
     * @memberof FailDetail
     */
    'message'?: string;
}

export const FailDetailReasonEnum = {
    CardInvalid: 'card_invalid',
    Declined: 'declined',
    Incomplete: 'incomplete',
    Timeout: 'timeout',
    InvalidSetup: 'invalid_setup',
    SecureAuthentication: 'secure_authentication',
    ErrorOnStart: 'error_on_start',
    Referral: 'referral',
    Error: 'error'
} as const;

export type FailDetailReasonEnum = typeof FailDetailReasonEnum[keyof typeof FailDetailReasonEnum];

/**
 * The data received from Google when integrating the \'Buy with Google Pay\' button. See https://github.com/datatrans/google-pay-web-sample for more information.
 * @export
 * @interface GooglePayRequest
 */
export interface GooglePayRequest {
    /**
     * Verifies that the message came from Google. It\'s Base64-encoded, and created with ECDSA by the intermediate signing key.
     * @type {string}
     * @memberof GooglePayRequest
     */
    'signature'?: string;
    /**
     * Identifies the encryption or signing scheme under which the message was created. It allows the protocol to evolve over time, if needed.
     * @type {string}
     * @memberof GooglePayRequest
     */
    'protocolVersion'?: string;
    /**
     * A JSON object serialized as a string that contains the encryptedMessage, ephemeralPublicKey, and tag. It\'s serialized to simplify the signature verification process.
     * @type {string}
     * @memberof GooglePayRequest
     */
    'signedMessage'?: string;
    /**
     * 
     * @type {IntermediateSigningKey}
     * @memberof GooglePayRequest
     */
    'intermediateSigningKey'?: IntermediateSigningKey;
}
/**
 * Google Pay specific parameters for the validate request.
 * @export
 * @interface GooglePayValidateRequest
 */
export interface GooglePayValidateRequest {
    /**
     * Verifies that the message came from Google. It\'s Base64-encoded, and created with ECDSA by the intermediate signing key.
     * @type {string}
     * @memberof GooglePayValidateRequest
     */
    'signature'?: string;
    /**
     * Identifies the encryption or signing scheme under which the message was created. It allows the protocol to evolve over time, if needed.
     * @type {string}
     * @memberof GooglePayValidateRequest
     */
    'protocolVersion'?: string;
    /**
     * A JSON object serialized as a string that contains the encryptedMessage, ephemeralPublicKey, and tag. It\'s serialized to simplify the signature verification process.
     * @type {string}
     * @memberof GooglePayValidateRequest
     */
    'signedMessage'?: string;
    /**
     * 
     * @type {IntermediateSigningKey}
     * @memberof GooglePayValidateRequest
     */
    'intermediateSigningKey'?: IntermediateSigningKey;
}
/**
 * Additional version-dependent information used to decrypt and verify the payment.
 * @export
 * @interface Header
 */
export interface Header {
    /**
     * Hash of the X.509 encoded public key bytes of the merchant’s certificate.
     * @type {string}
     * @memberof Header
     */
    'publicKeyHash'?: string;
    /**
     * Ephemeral public key bytes. `EC_v1` only.
     * @type {string}
     * @memberof Header
     */
    'ephemeralPublicKey'?: string;
    /**
     * Transaction identifier, generated on the device.
     * @type {string}
     * @memberof Header
     */
    'transactionId'?: string;
}
/**
 * 
 * @export
 * @interface InitDetail
 */
export interface InitDetail {
    /**
     * Tells when the initialized transaction will expire if not continued - 30 minutes after initialization.
     * @type {string}
     * @memberof InitDetail
     */
    'expires'?: string;
}
/**
 * 
 * @export
 * @interface InitRequest
 */
export interface InitRequest {
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof InitRequest
     */
    'currency': string;
    /**
     * The merchant\'s reference number. It should be unique for each transaction.
     * @type {string}
     * @memberof InitRequest
     */
    'refno': string;
    /**
     * Optional customer\'s reference number. Supported by some payment methods or acquirers.
     * @type {string}
     * @memberof InitRequest
     */
    'refno2'?: string;
    /**
     * Whether to automatically settle the transaction after an authorization or not. If not present with the init request, the settings defined in the dashboard (\'Authorisation / Settlement\' or \'Direct Debit\') will be used. Those settings will only be used for web transactions and not for server to server API calls.
     * @type {boolean}
     * @memberof InitRequest
     */
    'autoSettle'?: boolean;
    /**
     * 
     * @type {CustomerRequest}
     * @memberof InitRequest
     */
    'customer'?: CustomerRequest;
    /**
     * 
     * @type {BillingAddress}
     * @memberof InitRequest
     */
    'billing'?: BillingAddress;
    /**
     * 
     * @type {ShippingAddress}
     * @memberof InitRequest
     */
    'shipping'?: ShippingAddress;
    /**
     * 
     * @type {OrderRequest}
     * @memberof InitRequest
     */
    'order'?: OrderRequest;
    /**
     * 
     * @type {CardInitRequest}
     * @memberof InitRequest
     */
    'card'?: CardInitRequest;
    /**
     * 
     * @type {BoncardRequest}
     * @memberof InitRequest
     */
    'BON'?: BoncardRequest;
    /**
     * 
     * @type {PayPalInitRequest}
     * @memberof InitRequest
     */
    'PAP'?: PayPalInitRequest;
    /**
     * 
     * @type {PfcInitRequest}
     * @memberof InitRequest
     */
    'PFC'?: PfcInitRequest;
    /**
     * 
     * @type {RekaRequest}
     * @memberof InitRequest
     */
    'REK'?: RekaRequest;
    /**
     * 
     * @type {KlarnaInitRequest}
     * @memberof InitRequest
     */
    'KLN'?: KlarnaInitRequest;
    /**
     * 
     * @type {TwintRequest}
     * @memberof InitRequest
     */
    'TWI'?: TwintRequest;
    /**
     * 
     * @type {ByjunoAuthorizeRequest}
     * @memberof InitRequest
     */
    'INT'?: ByjunoAuthorizeRequest;
    /**
     * 
     * @type {ESY}
     * @memberof InitRequest
     */
    'ESY'?: ESY;
    /**
     * 
     * @type {AirlineDataRequest}
     * @memberof InitRequest
     */
    'airlineData'?: AirlineDataRequest;
    /**
     * The amount of the transaction in the currency’s smallest unit. For example use 1000 for CHF 10.00. Can be omitted for use cases where only a registration should take place (if the payment method supports registrations)
     * @type {number}
     * @memberof InitRequest
     */
    'amount'?: number;
    /**
     * This parameter specifies the language (language code) in which the payment page should be presented to the cardholder. The <a href=\'https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes\' target=\'_blank\'>ISO-639-1</a> two letter language codes listed above are supported
     * @type {string}
     * @memberof InitRequest
     */
    'language'?: InitRequestLanguageEnum;
    /**
     * An array of payment method shortnames. For example `[\"VIS\", \"PFC\"]`. If omitted, all available payment methods will be displayed on the payment page. If the Mobile SDKs are used (`returnMobileToken`), this array is mandatory.
     * @type {Array<string>}
     * @memberof InitRequest
     */
    'paymentMethods'?: Array<InitRequestPaymentMethodsEnum>;
    /**
     * 
     * @type {Theme}
     * @memberof InitRequest
     */
    'theme'?: Theme;
    /**
     * 
     * @type {RedirectRequest}
     * @memberof InitRequest
     */
    'redirect'?: RedirectRequest;
    /**
     * 
     * @type {OptionRequest}
     * @memberof InitRequest
     */
    'option'?: OptionRequest;
    /**
     * 
     * @type {SwissPassRequest}
     * @memberof InitRequest
     */
    'SWP'?: SwissPassRequest;
    /**
     * 
     * @type {MFXRequest}
     * @memberof InitRequest
     */
    'MFX'?: MFXRequest;
    /**
     * 
     * @type {MPXRequest}
     * @memberof InitRequest
     */
    'MPX'?: MPXRequest;
    /**
     * 
     * @type {AmazonPayRequest}
     * @memberof InitRequest
     */
    'AZP'?: AmazonPayRequest;
    /**
     * 
     * @type {EpsRequest}
     * @memberof InitRequest
     */
    'EPS'?: EpsRequest;
    /**
     * 
     * @type {AlipayRequest}
     * @memberof InitRequest
     */
    'ALP'?: AlipayRequest;
    /**
     * 
     * @type {WeChatRequest}
     * @memberof InitRequest
     */
    'WEC'?: WeChatRequest;
    /**
     * 
     * @type {SwissBillingRequest}
     * @memberof InitRequest
     */
    'SWB'?: SwissBillingRequest;
    /**
     * 
     * @type {MDPInitRequest}
     * @memberof InitRequest
     */
    'MDP'?: MDPInitRequest;
    /**
     * 
     * @type {PaysafecardRequest}
     * @memberof InitRequest
     */
    'PSC'?: PaysafecardRequest;
}

export const InitRequestLanguageEnum = {
    En: 'en',
    De: 'de',
    Fr: 'fr',
    It: 'it',
    Es: 'es',
    El: 'el',
    No: 'no',
    Da: 'da',
    Pl: 'pl',
    Pt: 'pt',
    Ru: 'ru',
    Ja: 'ja'
} as const;

export type InitRequestLanguageEnum = typeof InitRequestLanguageEnum[keyof typeof InitRequestLanguageEnum];
export const InitRequestPaymentMethodsEnum = {
    Acc: 'ACC',
    Alp: 'ALP',
    Apl: 'APL',
    Amx: 'AMX',
    Azp: 'AZP',
    Bon: 'BON',
    Cfy: 'CFY',
    Csy: 'CSY',
    Cup: 'CUP',
    Dea: 'DEA',
    Din: 'DIN',
    Dii: 'DII',
    Dib: 'DIB',
    Dis: 'DIS',
    Dnk: 'DNK',
    Eca: 'ECA',
    Elv: 'ELV',
    Eps: 'EPS',
    Esy: 'ESY',
    Gpa: 'GPA',
    Int: 'INT',
    Jcb: 'JCB',
    Jel: 'JEL',
    Kln: 'KLN',
    Mau: 'MAU',
    Mdp: 'MDP',
    Mfx: 'MFX',
    Mpx: 'MPX',
    Myo: 'MYO',
    Pap: 'PAP',
    Pay: 'PAY',
    Pef: 'PEF',
    Pfc: 'PFC',
    Psc: 'PSC',
    Rek: 'REK',
    Sam: 'SAM',
    Swb: 'SWB',
    Scx: 'SCX',
    Swp: 'SWP',
    Twi: 'TWI',
    Uap: 'UAP',
    Vis: 'VIS',
    Wec: 'WEC'
} as const;

export type InitRequestPaymentMethodsEnum = typeof InitRequestPaymentMethodsEnum[keyof typeof InitRequestPaymentMethodsEnum];

/**
 * 
 * @export
 * @interface InitResponse
 */
export interface InitResponse {
    /**
     * The `transactionId` to be used when using Redirect- or Lightbox Mode. If no further action happens with the `transactionId` after initialization, it will be invalidated after 30 minutes.
     * @type {string}
     * @memberof InitResponse
     */
    'transactionId'?: string;
    /**
     * Mobile token which is needed to initialize the Mobile SDKs.
     * @type {string}
     * @memberof InitResponse
     */
    'mobileToken'?: string;
    /**
     * 
     * @type {WeChatResponse}
     * @memberof InitResponse
     */
    'WEC'?: WeChatResponse;
    /**
     * 
     * @type {Secure3DResponse}
     * @memberof InitResponse
     */
    '3D'?: Secure3DResponse;
}
/**
 * If `mode` equals `installment` this object defines the rate model of it
 * @export
 * @interface Installment
 */
export interface Installment {
    /**
     * The preferred rate model of the installment
     * @type {string}
     * @memberof Installment
     */
    'rate'?: InstallmentRateEnum;
}

export const InstallmentRateEnum = {
    _3x3: '3x3',
    _4x12: '4x12',
    _12x12: '12x12'
} as const;

export type InstallmentRateEnum = typeof InstallmentRateEnum[keyof typeof InstallmentRateEnum];

/**
 * A JSON object that contains the intermediate signing key from Google. It contains the signedKey with keyValue, keyExpiration, and signatures. It\'s serialized to simplify the intermediate signing key signature verification process.
 * @export
 * @interface IntermediateSigningKey
 */
export interface IntermediateSigningKey {
    /**
     * 
     * @type {string}
     * @memberof IntermediateSigningKey
     */
    'signedKey'?: string;
    /**
     * 
     * @type {Array<object>}
     * @memberof IntermediateSigningKey
     */
    'signatures'?: Array<object>;
}
/**
 * 
 * @export
 * @interface KlarnaAddress
 */
export interface KlarnaAddress {
    /**
     * The street name and number
     * @type {string}
     * @memberof KlarnaAddress
     */
    'streetAddress'?: string;
    /**
     * The postal code
     * @type {string}
     * @memberof KlarnaAddress
     */
    'postalCode'?: string;
    /**
     * The name of the city
     * @type {string}
     * @memberof KlarnaAddress
     */
    'city'?: string;
    /**
     * The name of the country
     * @type {string}
     * @memberof KlarnaAddress
     */
    'country'?: string;
}
/**
 * 
 * @export
 * @interface KlarnaArena
 */
export interface KlarnaArena {
    /**
     * The name of the venue
     * @type {string}
     * @memberof KlarnaArena
     */
    'name'?: string;
    /**
     * The street of the arena location
     * @type {string}
     * @memberof KlarnaArena
     */
    'street'?: string;
    /**
     * The postal code of the arena location
     * @type {string}
     * @memberof KlarnaArena
     */
    'zipCode'?: string;
    /**
     * The city of the arena location
     * @type {string}
     * @memberof KlarnaArena
     */
    'city'?: string;
    /**
     * The country of the arena location
     * @type {string}
     * @memberof KlarnaArena
     */
    'country'?: string;
}
/**
 * 
 * @export
 * @interface KlarnaAuthorizeRequest
 */
export interface KlarnaAuthorizeRequest {
    /**
     * The Klarna specific payment method used for the transaction.
     * @type {string}
     * @memberof KlarnaAuthorizeRequest
     */
    'subPaymentMethod'?: KlarnaAuthorizeRequestSubPaymentMethodEnum;
    /**
     * A list of Klarna events.
     * @type {Array<KlarnaEvent>}
     * @memberof KlarnaAuthorizeRequest
     */
    'events'?: Array<KlarnaEvent>;
    /**
     * A list of Klarna subscriptions.
     * @type {Array<KlarnaSubscription>}
     * @memberof KlarnaAuthorizeRequest
     */
    'subscriptions'?: Array<KlarnaSubscription>;
    /**
     * A list of Klarna customer account infos.
     * @type {Array<KlarnaCustomerAccountInfo>}
     * @memberof KlarnaAuthorizeRequest
     */
    'accountInfos'?: Array<KlarnaCustomerAccountInfo>;
    /**
     * A list of simple history entries
     * @type {Array<KlarnaPaymentHistorySimple>}
     * @memberof KlarnaAuthorizeRequest
     */
    'historySimple'?: Array<KlarnaPaymentHistorySimple>;
    /**
     * A list of full history entries
     * @type {Array<KlarnaPaymentHistoryFull>}
     * @memberof KlarnaAuthorizeRequest
     */
    'historyFull'?: Array<KlarnaPaymentHistoryFull>;
    /**
     * A list of hotel reservation details
     * @type {Array<KlarnaHotelReservationDetail>}
     * @memberof KlarnaAuthorizeRequest
     */
    'hotelReservationDetails'?: Array<KlarnaHotelReservationDetail>;
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof KlarnaAuthorizeRequest
     */
    'alias': string;
}

export const KlarnaAuthorizeRequestSubPaymentMethodEnum = {
    PayNow: 'pay_now',
    PayLater: 'pay_later',
    PayOverTime: 'pay_over_time',
    DirectDebit: 'direct_debit',
    DirectBankTransfer: 'direct_bank_transfer'
} as const;

export type KlarnaAuthorizeRequestSubPaymentMethodEnum = typeof KlarnaAuthorizeRequestSubPaymentMethodEnum[keyof typeof KlarnaAuthorizeRequestSubPaymentMethodEnum];

/**
 * A list of Klarna customer account infos.
 * @export
 * @interface KlarnaCustomerAccountInfo
 */
export interface KlarnaCustomerAccountInfo {
    /**
     * A unique name or number to identify the specific customer account. Max. 24 characters.
     * @type {string}
     * @memberof KlarnaCustomerAccountInfo
     */
    'uniqueIdentifier'?: string;
    /**
     * The registration date and time of the account. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaCustomerAccountInfo
     */
    'registrationDate'?: string;
    /**
     * The date and time the account was modified the last time. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaCustomerAccountInfo
     */
    'lastModified'?: string;
}
/**
 * If KLN was used for a transaction the object holds all Klarna relevant properties.
 * @export
 * @interface KlarnaDetail
 */
export interface KlarnaDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof KlarnaDetail
     */
    'alias'?: string;
    /**
     * The Klarna payment subtype.
     * @type {string}
     * @memberof KlarnaDetail
     */
    'subtype'?: KlarnaDetailSubtypeEnum;
}

export const KlarnaDetailSubtypeEnum = {
    PayNow: 'pay_now',
    PayLater: 'pay_later',
    PayOverTime: 'pay_over_time',
    DirectDebit: 'direct_debit',
    DirectBankTransfer: 'direct_bank_transfer'
} as const;

export type KlarnaDetailSubtypeEnum = typeof KlarnaDetailSubtypeEnum[keyof typeof KlarnaDetailSubtypeEnum];

/**
 * A Klarna event.
 * @export
 * @interface KlarnaEvent
 */
export interface KlarnaEvent {
    /**
     * The name of the event.
     * @type {string}
     * @memberof KlarnaEvent
     */
    'name'?: string;
    /**
     * The name of the company arranging the event.
     * @type {string}
     * @memberof KlarnaEvent
     */
    'company'?: string;
    /**
     * The genre of the event.
     * @type {string}
     * @memberof KlarnaEvent
     */
    'genre'?: string;
    /**
     * 
     * @type {KlarnaArena}
     * @memberof KlarnaEvent
     */
    'arena'?: KlarnaArena;
    /**
     * The start date and time of the event. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaEvent
     */
    'start'?: string;
    /**
     * The end date and time of the event. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaEvent
     */
    'end'?: string;
    /**
     * Tickets are digitally checked when entering the venue.
     * @type {boolean}
     * @memberof KlarnaEvent
     */
    'accessControlledVenue'?: boolean;
    /**
     * The ticket delivery method.
     * @type {string}
     * @memberof KlarnaEvent
     */
    'ticketDeliveryMethod'?: KlarnaEventTicketDeliveryMethodEnum;
    /**
     * The name of the recipient the ticket is delivered to. If the method isEMAIL or PHONE, use either the email address or the phone number.
     * @type {string}
     * @memberof KlarnaEvent
     */
    'ticketDeliveryRecipient'?: string;
    /**
     * The name of the affiliate that originated the purchase.
     * @type {string}
     * @memberof KlarnaEvent
     */
    'affiliateName'?: string;
}

export const KlarnaEventTicketDeliveryMethodEnum = {
    PickUp: 'PICK_UP',
    Email: 'EMAIL',
    Post: 'POST',
    Phone: 'PHONE'
} as const;

export type KlarnaEventTicketDeliveryMethodEnum = typeof KlarnaEventTicketDeliveryMethodEnum[keyof typeof KlarnaEventTicketDeliveryMethodEnum];

/**
 * Hotel itinerary data, one per hotel stay
 * @export
 * @interface KlarnaHotelItinerary
 */
export interface KlarnaHotelItinerary {
    /**
     * Name of hotel
     * @type {string}
     * @memberof KlarnaHotelItinerary
     */
    'hotelName'?: string;
    /**
     * 
     * @type {KlarnaAddress}
     * @memberof KlarnaHotelItinerary
     */
    'address'?: KlarnaAddress;
    /**
     * The start date and time of the reservation. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaHotelItinerary
     */
    'startTime'?: string;
    /**
     * The end date and time of the reservation. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaHotelItinerary
     */
    'endTime'?: string;
    /**
     * 
     * @type {number}
     * @memberof KlarnaHotelItinerary
     */
    'numberOfRooms'?: number;
    /**
     * 
     * @type {Array<number>}
     * @memberof KlarnaHotelItinerary
     */
    'passengerId'?: Array<number>;
    /**
     * 
     * @type {string}
     * @memberof KlarnaHotelItinerary
     */
    'ticketDeliveryMethod'?: KlarnaHotelItineraryTicketDeliveryMethodEnum;
    /**
     * The name of the recipient the ticket is delivered to. If email or phone, then use either the email address or the phone number.
     * @type {string}
     * @memberof KlarnaHotelItinerary
     */
    'ticketDeliveryRecipient'?: string;
    /**
     * Local currency
     * @type {number}
     * @memberof KlarnaHotelItinerary
     */
    'hotelPrice'?: number;
    /**
     * 
     * @type {string}
     * @memberof KlarnaHotelItinerary
     */
    'class'?: string;
}

export const KlarnaHotelItineraryTicketDeliveryMethodEnum = {
    PickUp: 'pick_up',
    Email: 'email',
    Post: 'post',
    Phone: 'phone'
} as const;

export type KlarnaHotelItineraryTicketDeliveryMethodEnum = typeof KlarnaHotelItineraryTicketDeliveryMethodEnum[keyof typeof KlarnaHotelItineraryTicketDeliveryMethodEnum];

/**
 * A list of hotel reservation details
 * @export
 * @interface KlarnaHotelReservationDetail
 */
export interface KlarnaHotelReservationDetail {
    /**
     * Trip booking number, e.g. VH67899
     * @type {string}
     * @memberof KlarnaHotelReservationDetail
     */
    'pnr'?: string;
    /**
     * Hotel itinerary data, one per hotel stay
     * @type {Array<KlarnaHotelItinerary>}
     * @memberof KlarnaHotelReservationDetail
     */
    'hotelItinerary'?: Array<KlarnaHotelItinerary>;
    /**
     * Insurance data
     * @type {Array<KlarnaInsurance>}
     * @memberof KlarnaHotelReservationDetail
     */
    'insurance'?: Array<KlarnaInsurance>;
    /**
     * Passenger data
     * @type {Array<KlarnaPassenger>}
     * @memberof KlarnaHotelReservationDetail
     */
    'passengers'?: Array<KlarnaPassenger>;
    /**
     * Name of the affiliate that originated the purchase. If none, leave blank.
     * @type {string}
     * @memberof KlarnaHotelReservationDetail
     */
    'affiliateName'?: string;
}
/**
 * 
 * @export
 * @interface KlarnaInitRequest
 */
export interface KlarnaInitRequest {
    /**
     * The Klarna specific payment method used for the transaction.
     * @type {string}
     * @memberof KlarnaInitRequest
     */
    'subPaymentMethod'?: KlarnaInitRequestSubPaymentMethodEnum;
    /**
     * A list of Klarna events.
     * @type {Array<KlarnaEvent>}
     * @memberof KlarnaInitRequest
     */
    'events'?: Array<KlarnaEvent>;
    /**
     * A list of Klarna subscriptions.
     * @type {Array<KlarnaSubscription>}
     * @memberof KlarnaInitRequest
     */
    'subscriptions'?: Array<KlarnaSubscription>;
    /**
     * A list of Klarna customer account infos.
     * @type {Array<KlarnaCustomerAccountInfo>}
     * @memberof KlarnaInitRequest
     */
    'accountInfos'?: Array<KlarnaCustomerAccountInfo>;
    /**
     * A list of simple history entries
     * @type {Array<KlarnaPaymentHistorySimple>}
     * @memberof KlarnaInitRequest
     */
    'historySimple'?: Array<KlarnaPaymentHistorySimple>;
    /**
     * A list of full history entries
     * @type {Array<KlarnaPaymentHistoryFull>}
     * @memberof KlarnaInitRequest
     */
    'historyFull'?: Array<KlarnaPaymentHistoryFull>;
    /**
     * A list of hotel reservation details
     * @type {Array<KlarnaHotelReservationDetail>}
     * @memberof KlarnaInitRequest
     */
    'hotelReservationDetails'?: Array<KlarnaHotelReservationDetail>;
}

export const KlarnaInitRequestSubPaymentMethodEnum = {
    PayNow: 'pay_now',
    PayLater: 'pay_later',
    PayOverTime: 'pay_over_time',
    DirectDebit: 'direct_debit',
    DirectBankTransfer: 'direct_bank_transfer'
} as const;

export type KlarnaInitRequestSubPaymentMethodEnum = typeof KlarnaInitRequestSubPaymentMethodEnum[keyof typeof KlarnaInitRequestSubPaymentMethodEnum];

/**
 * Insurance data
 * @export
 * @interface KlarnaInsurance
 */
export interface KlarnaInsurance {
    /**
     * 
     * @type {string}
     * @memberof KlarnaInsurance
     */
    'insuranceCompany'?: string;
    /**
     * 
     * @type {string}
     * @memberof KlarnaInsurance
     */
    'insuranceType'?: KlarnaInsuranceInsuranceTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof KlarnaInsurance
     */
    'insurancePrice'?: number;
}

export const KlarnaInsuranceInsuranceTypeEnum = {
    Cancellation: 'cancellation',
    Travel: 'travel',
    CancellationTravel: 'cancellation_travel',
    Bankruptcy: 'bankruptcy'
} as const;

export type KlarnaInsuranceInsuranceTypeEnum = typeof KlarnaInsuranceInsuranceTypeEnum[keyof typeof KlarnaInsuranceInsuranceTypeEnum];

/**
 * Passenger data
 * @export
 * @interface KlarnaPassenger
 */
export interface KlarnaPassenger {
    /**
     * 
     * @type {number}
     * @memberof KlarnaPassenger
     */
    'id'?: number;
    /**
     * Mr, Mrs, Ms or blank if under 12 years
     * @type {string}
     * @memberof KlarnaPassenger
     */
    'title'?: KlarnaPassengerTitleEnum;
    /**
     * First name of the passenger
     * @type {string}
     * @memberof KlarnaPassenger
     */
    'firstName'?: string;
    /**
     * Last name of the passenger
     * @type {string}
     * @memberof KlarnaPassenger
     */
    'lastName'?: string;
}

export const KlarnaPassengerTitleEnum = {
    Mr: 'MR',
    Mrs: 'MRS',
    Ms: 'MS'
} as const;

export type KlarnaPassengerTitleEnum = typeof KlarnaPassengerTitleEnum[keyof typeof KlarnaPassengerTitleEnum];

/**
 * A list of full history entries
 * @export
 * @interface KlarnaPaymentHistoryFull
 */
export interface KlarnaPaymentHistoryFull {
    /**
     * Unique name or number to identify the specific customer account. Max. 24 characters.
     * @type {string}
     * @memberof KlarnaPaymentHistoryFull
     */
    'uniqueIdentifier'?: string;
    /**
     * The type of the line item
     * @type {string}
     * @memberof KlarnaPaymentHistoryFull
     */
    'paymentOption'?: KlarnaPaymentHistoryFullPaymentOptionEnum;
    /**
     * The total number of successful purchases.
     * @type {number}
     * @memberof KlarnaPaymentHistoryFull
     */
    'paidPurchases'?: number;
    /**
     * The total amount of successful purchases (in local currency).
     * @type {number}
     * @memberof KlarnaPaymentHistoryFull
     */
    'totalAmountPaidPurchases'?: number;
    /**
     * The date and time of the last paid purchase. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaPaymentHistoryFull
     */
    'lastPaidPurchase'?: string;
    /**
     * The date and time of the first paid purchase. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaPaymentHistoryFull
     */
    'firstPaidPurchase'?: string;
}

export const KlarnaPaymentHistoryFullPaymentOptionEnum = {
    Card: 'CARD',
    DirectBanking: 'DIRECT_BANKING',
    NonKlarna: 'NON_KLARNA',
    Credit: 'CREDIT',
    Sms: 'SMS',
    Other: 'OTHER'
} as const;

export type KlarnaPaymentHistoryFullPaymentOptionEnum = typeof KlarnaPaymentHistoryFullPaymentOptionEnum[keyof typeof KlarnaPaymentHistoryFullPaymentOptionEnum];

/**
 * A list of simple history entries
 * @export
 * @interface KlarnaPaymentHistorySimple
 */
export interface KlarnaPaymentHistorySimple {
    /**
     * Unique name or number to identify the specific customer account. Max. 24 characters.
     * @type {string}
     * @memberof KlarnaPaymentHistorySimple
     */
    'uniqueIdentifier'?: string;
    /**
     * Whether the customer has paid before or not.
     * @type {boolean}
     * @memberof KlarnaPaymentHistorySimple
     */
    'paidBefore'?: boolean;
}
/**
 * A list of Klarna subscriptions.
 * @export
 * @interface KlarnaSubscription
 */
export interface KlarnaSubscription {
    /**
     * The name of the product of the subscription
     * @type {string}
     * @memberof KlarnaSubscription
     */
    'name'?: string;
    /**
     * The start date and time of the subscription. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaSubscription
     */
    'start'?: string;
    /**
     * The end date and time of the subscription. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (e.g. `YYYY-MM-DDTHH:MM:ss.SSSZ`).
     * @type {string}
     * @memberof KlarnaSubscription
     */
    'end'?: string;
    /**
     * `true` if the subscription will be auto renewed upon expiry.
     * @type {boolean}
     * @memberof KlarnaSubscription
     */
    'autoRenewal'?: boolean;
    /**
     * The name of the affiliate that originated the purchase.
     * @type {string}
     * @memberof KlarnaSubscription
     */
    'affiliateName'?: string;
}
/**
 * Klarna specific parameters
 * @export
 * @interface KlarnaValidateRequest
 */
export interface KlarnaValidateRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof KlarnaValidateRequest
     */
    'alias'?: string;
}
/**
 * List of ticket\'s legs
 * @export
 * @interface Leg
 */
export interface Leg {
    /**
     * The origin or departure airport code for this leg.
     * @type {string}
     * @memberof Leg
     */
    'departureAirport'?: string;
    /**
     * The destination or arrival airport code for this leg.
     * @type {string}
     * @memberof Leg
     */
    'arrivalAirport'?: string;
    /**
     * Carrier airline code(i.e.\'OS\')
     * @type {string}
     * @memberof Leg
     */
    'carrier'?: string;
    /**
     * Fare  basis (i.e. \'URRVP/OCF\')
     * @type {string}
     * @memberof Leg
     */
    'fareBasis'?: string;
    /**
     * Flight number (i.e. OS 834)
     * @type {string}
     * @memberof Leg
     */
    'flightNumber'?: string;
    /**
     * Date of flight. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (`YYYY-MM-DD`).
     * @type {string}
     * @memberof Leg
     */
    'flightDate'?: string;
    /**
     * 
     * @type {LocalTime}
     * @memberof Leg
     */
    'departureTime'?: LocalTime;
    /**
     * 
     * @type {LocalTime}
     * @memberof Leg
     */
    'arrivalTime'?: LocalTime;
    /**
     * Class code (i.e.\'U\')
     * @type {string}
     * @memberof Leg
     */
    'class'?: string;
}
/**
 * Flight\'s arrival time. Must be in <a href=\'https://en.wikipedia.org/wiki/ISO_8601\' target=\'_blank\'>ISO-8601</a> format (`hh:mm`).
 * @export
 * @interface LocalTime
 */
export interface LocalTime {
    /**
     * 
     * @type {number}
     * @memberof LocalTime
     */
    'hour'?: number;
    /**
     * 
     * @type {number}
     * @memberof LocalTime
     */
    'minute'?: number;
    /**
     * 
     * @type {number}
     * @memberof LocalTime
     */
    'second'?: number;
    /**
     * 
     * @type {number}
     * @memberof LocalTime
     */
    'nano'?: number;
}
/**
 * If MDP was used for a transaction the object holds all MDP relevant properties.
 * @export
 * @interface MDPDetail
 */
export interface MDPDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof MDPDetail
     */
    'alias'?: string;
}
/**
 * 
 * @export
 * @interface MDPInitRequest
 */
export interface MDPInitRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof MDPInitRequest
     */
    'alias'?: string;
}
/**
 * If MFX was used for a transaction the object holds all MFX relevant properties.
 * @export
 * @interface MFXDetail
 */
export interface MFXDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof MFXDetail
     */
    'alias'?: string;
    /**
     * 
     * @type {EsrData}
     * @memberof MFXDetail
     */
    'esr'?: EsrData;
}
/**
 * MFX specific parameters
 * @export
 * @interface MFXRequest
 */
export interface MFXRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof MFXRequest
     */
    'alias': string;
    /**
     * If set to `true`, The customers bank details (ESR data) are available from the Status API
     * @type {boolean}
     * @memberof MFXRequest
     */
    'invoiceOnDelivery'?: boolean;
}
/**
 * If MPX was used for a transaction the object holds all MPX relevant properties.
 * @export
 * @interface MPXDetail
 */
export interface MPXDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof MPXDetail
     */
    'alias'?: string;
    /**
     * 
     * @type {EsrData}
     * @memberof MPXDetail
     */
    'esr'?: EsrData;
}
/**
 * MPX specific parameters
 * @export
 * @interface MPXRequest
 */
export interface MPXRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof MPXRequest
     */
    'alias': string;
    /**
     * If set to `true`, The customers bank details (ESR data) are available from the Status API
     * @type {boolean}
     * @memberof MPXRequest
     */
    'invoiceOnDelivery'?: boolean;
}
/**
 * If you are a marketplace merchant, use this object to send one or multiplesplits per transaction.
 * @export
 * @interface MarketPlace
 */
export interface MarketPlace {
    /**
     * The marketplace splits
     * @type {Array<MarketPlaceSplit>}
     * @memberof MarketPlace
     */
    'splits': Array<MarketPlaceSplit>;
}
/**
 * 
 * @export
 * @interface MarketPlaceAuthorize
 */
export interface MarketPlaceAuthorize {
    /**
     * The marketplace splits
     * @type {Array<MarketPlaceSplit>}
     * @memberof MarketPlaceAuthorize
     */
    'splits': Array<MarketPlaceSplit>;
}
/**
 * 
 * @export
 * @interface MarketPlaceCredit
 */
export interface MarketPlaceCredit {
    /**
     * The marketplace splits
     * @type {Array<MarketPlaceSplit>}
     * @memberof MarketPlaceCredit
     */
    'splits': Array<MarketPlaceSplit>;
}
/**
 * 
 * @export
 * @interface MarketPlaceSettle
 */
export interface MarketPlaceSettle {
    /**
     * The marketplace splits
     * @type {Array<MarketPlaceSplit>}
     * @memberof MarketPlaceSettle
     */
    'splits': Array<MarketPlaceSplit>;
}
/**
 * The marketplace splits
 * @export
 * @interface MarketPlaceSplit
 */
export interface MarketPlaceSplit {
    /**
     * Your sub-merchant\'s ID. This value is specified by your collector.
     * @type {string}
     * @memberof MarketPlaceSplit
     */
    'subMerchantId'?: string;
    /**
     * The share of the transaction that you want to be transferred to / from a sub-merchant\'s account in the currency\'s smallest unit. For example use 1000 for CHF 10.00. The amount cannot be 0. The sum of all split amounts have to match the transaction amount.
     * @type {number}
     * @memberof MarketPlaceSplit
     */
    'amount'?: number;
    /**
     * Your marketplace commission in the currency\'s smallest unit. For example use 1000 for CHF 10.00. The commission will always be deducted from the split amount and can therefore not be higher than the split amount. For settlements, the commission will be deducted from the amount to be paid out to the sub-merchant and credited to your marketplace account. For refunds, the commission will be deducted from the amount to be debited from the sub-merchant and debited instead from your marketplace account.
     * @type {number}
     * @memberof MarketPlaceSplit
     */
    'commission'?: number;
}
/**
 * 
 * @export
 * @interface MerchantData
 */
export interface MerchantData {
    /**
     * 
     * @type {string}
     * @memberof MerchantData
     */
    'whiteListStatus'?: MerchantDataWhiteListStatusEnum;
}

export const MerchantDataWhiteListStatusEnum = {
    Y: 'Y',
    N: 'N'
} as const;

export type MerchantDataWhiteListStatusEnum = typeof MerchantDataWhiteListStatusEnum[keyof typeof MerchantDataWhiteListStatusEnum];

/**
 * 
 * @export
 * @interface MerchantRiskIndicator
 */
export interface MerchantRiskIndicator {
    /**
     * 
     * @type {string}
     * @memberof MerchantRiskIndicator
     */
    'shipIndicator'?: MerchantRiskIndicatorShipIndicatorEnum;
    /**
     * 
     * @type {string}
     * @memberof MerchantRiskIndicator
     */
    'deliveryTimeframe'?: MerchantRiskIndicatorDeliveryTimeframeEnum;
    /**
     * 
     * @type {string}
     * @memberof MerchantRiskIndicator
     */
    'deliveryEmailAddress'?: string;
    /**
     * 
     * @type {string}
     * @memberof MerchantRiskIndicator
     */
    'reorderItemsInd'?: MerchantRiskIndicatorReorderItemsIndEnum;
    /**
     * 
     * @type {string}
     * @memberof MerchantRiskIndicator
     */
    'preOrderPurchaseInd'?: MerchantRiskIndicatorPreOrderPurchaseIndEnum;
    /**
     * 
     * @type {string}
     * @memberof MerchantRiskIndicator
     */
    'preOrderDate'?: string;
    /**
     * 
     * @type {number}
     * @memberof MerchantRiskIndicator
     */
    'giftCardAmount'?: number;
    /**
     * 
     * @type {string}
     * @memberof MerchantRiskIndicator
     */
    'giftCardCurr'?: string;
    /**
     * 
     * @type {string}
     * @memberof MerchantRiskIndicator
     */
    'giftCardCount'?: string;
}

export const MerchantRiskIndicatorShipIndicatorEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04',
    _05: '05',
    _06: '06',
    _07: '07'
} as const;

export type MerchantRiskIndicatorShipIndicatorEnum = typeof MerchantRiskIndicatorShipIndicatorEnum[keyof typeof MerchantRiskIndicatorShipIndicatorEnum];
export const MerchantRiskIndicatorDeliveryTimeframeEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04'
} as const;

export type MerchantRiskIndicatorDeliveryTimeframeEnum = typeof MerchantRiskIndicatorDeliveryTimeframeEnum[keyof typeof MerchantRiskIndicatorDeliveryTimeframeEnum];
export const MerchantRiskIndicatorReorderItemsIndEnum = {
    _01: '01',
    _02: '02'
} as const;

export type MerchantRiskIndicatorReorderItemsIndEnum = typeof MerchantRiskIndicatorReorderItemsIndEnum[keyof typeof MerchantRiskIndicatorReorderItemsIndEnum];
export const MerchantRiskIndicatorPreOrderPurchaseIndEnum = {
    _01: '01',
    _02: '02'
} as const;

export type MerchantRiskIndicatorPreOrderPurchaseIndEnum = typeof MerchantRiskIndicatorPreOrderPurchaseIndEnum[keyof typeof MerchantRiskIndicatorPreOrderPurchaseIndEnum];

/**
 * 
 * @export
 * @interface OptionRequest
 */
export interface OptionRequest {
    /**
     * Whether an alias should be created for this transaction or not. If set to `true` an alias will be created. This alias can then be used to [initialize](#operation/init) or [authorize](#operation/authorize) a transaction. One possible use case is to charge the card of an existing (registered) cardholder.
     * @type {boolean}
     * @memberof OptionRequest
     */
    'createAlias'?: boolean;
    /**
     * Whether to return the masked card number. Format: `520000xxxxxx0080`
     * @type {boolean}
     * @memberof OptionRequest
     */
    'returnMaskedCardNumber'?: boolean;
    /**
     * If set to `true`, the country of the customers issuer will be returned.
     * @type {boolean}
     * @memberof OptionRequest
     */
    'returnCustomerCountry'?: boolean;
    /**
     * Whether to only authenticate the transaction (3D process only). If set to `true`, the actual authorization will not take place.
     * @type {boolean}
     * @memberof OptionRequest
     */
    'authenticationOnly'?: boolean;
    /**
     * Whether to show a checkbox on the payment page to let the customer choose if they want to save their card information.
     * @type {string}
     * @memberof OptionRequest
     */
    'rememberMe'?: OptionRequestRememberMeEnum;
    /**
     * Indicates that a mobile token should be created. This is needed when using our Mobile SDKs.
     * @type {boolean}
     * @memberof OptionRequest
     */
    'returnMobileToken'?: boolean;
}

export const OptionRequestRememberMeEnum = {
    True: 'true',
    Checked: 'checked'
} as const;

export type OptionRequestRememberMeEnum = typeof OptionRequestRememberMeEnum[keyof typeof OptionRequestRememberMeEnum];

/**
 * Order Meta Data
 * @export
 * @interface OrderMetaData
 */
export interface OrderMetaData {
    /**
     * The version of OrderMetaData field (used for tracking schema changes to the field).
     * @type {string}
     * @memberof OrderMetaData
     */
    'version'?: string;
    /**
     * The number of items that the order contains. For example, two cups of coffee.
     * @type {number}
     * @memberof OrderMetaData
     */
    'numberOfItems'?: number;
    /**
     * Type of items. Physical, Digital, Mixed
     * @type {string}
     * @memberof OrderMetaData
     */
    'type'?: OrderMetaDataTypeEnum;
    /**
     * Order ID of the related order. For the deposit this field will be empty, while for any subsequent payment related to the same booking this will be the order ID of the deposit transaction.
     * @type {string}
     * @memberof OrderMetaData
     */
    'relatedOrderReferenceId'?: string;
}

export const OrderMetaDataTypeEnum = {
    Physical: 'PHYSICAL',
    Digital: 'DIGITAL',
    Mixed: 'MIXED'
} as const;

export type OrderMetaDataTypeEnum = typeof OrderMetaDataTypeEnum[keyof typeof OrderMetaDataTypeEnum];

/**
 * If supported by the payment method, an order with one or more articles can be defined.
 * @export
 * @interface OrderRequest
 */
export interface OrderRequest {
    /**
     * 
     * @type {Array<Article>}
     * @memberof OrderRequest
     */
    'articles'?: Array<Article>;
    /**
     * 
     * @type {number}
     * @memberof OrderRequest
     */
    'taxAmount'?: number;
    /**
     * 
     * @type {number}
     * @memberof OrderRequest
     */
    'shippingAmount'?: number;
    /**
     * 
     * @type {number}
     * @memberof OrderRequest
     */
    'discountAmount'?: number;
}
/**
 * Passengers information
 * @export
 * @interface Passenger
 */
export interface Passenger {
    /**
     * Number of passengers
     * @type {number}
     * @memberof Passenger
     */
    'numberOfPassengers'?: number;
    /**
     * The number of passengers who are children (ages 2 to 18)
     * @type {number}
     * @memberof Passenger
     */
    'numberOfChildren'?: number;
    /**
     * The number of passengers who are under the age of 2
     * @type {number}
     * @memberof Passenger
     */
    'numberOfInfants'?: number;
}
/**
 * 
 * @export
 * @interface PayPalAuthorizeRequest
 */
export interface PayPalAuthorizeRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof PayPalAuthorizeRequest
     */
    'alias'?: string;
    /**
     * The transactionId of the order request executed previously, if this authorization is part of the order-authorize-capture (AC2) flow.
     * @type {string}
     * @memberof PayPalAuthorizeRequest
     */
    'orderTransactionId'?: string;
    /**
     * The PayPal FraudNet session identifier as specified in the API documentation.
     * @type {string}
     * @memberof PayPalAuthorizeRequest
     */
    'fraudSessionId'?: string;
}
/**
 * If PayPal was used for a transaction the object holds all PayPal relevant properties.
 * @export
 * @interface PayPalDetail
 */
export interface PayPalDetail {
    /**
     * The PayPal orderId, if the transaction was a PayPal order.
     * @type {string}
     * @memberof PayPalDetail
     */
    'orderId'?: string;
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof PayPalDetail
     */
    'alias'?: string;
    /**
     * The PayPal payerId
     * @type {string}
     * @memberof PayPalDetail
     */
    'payerId'?: string;
}
/**
 * PayPal specific parameters
 * @export
 * @interface PayPalInitRequest
 */
export interface PayPalInitRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof PayPalInitRequest
     */
    'alias'?: string;
    /**
     * A https URL to the logo of the merchant.
     * @type {string}
     * @memberof PayPalInitRequest
     */
    'imageUrl'?: string;
    /**
     * Regulates whether the shipping details are displayed or not. (Note: `forwardCustomerDetails` and `displayShippingDetails` should be set to `no` if the shipping details should not be shown on the PayPal page.
     * @type {boolean}
     * @memberof PayPalInitRequest
     */
    'displayShippingDetails'?: boolean;
    /**
     * `true` if the customer details (if submitted) should be forwarded to PayPal. Default is `false`.
     * @type {boolean}
     * @memberof PayPalInitRequest
     */
    'forwardCustomerDetails'?: boolean;
    /**
     * `true` if the customer details should be retrieved from PayPal.
     * @type {boolean}
     * @memberof PayPalInitRequest
     */
    'returnCustomerDetails'?: boolean;
    /**
     * `true` if a PayPal AC2 order is to be created. Default is `false`.
     * @type {boolean}
     * @memberof PayPalInitRequest
     */
    'createOrder'?: boolean;
    /**
     * The PayPal FraudNet session identifier as specified in the API documentation.
     * @type {string}
     * @memberof PayPalInitRequest
     */
    'fraudSessionId'?: string;
    /**
     * PayPal transaction context specific parameters. Use the same properties as you would for direct Transaction Context requests
     * @type {object}
     * @memberof PayPalInitRequest
     */
    'transactionContext'?: object;
}
/**
 * PayPal specific parameters for the validate request.
 * @export
 * @interface PayPalValidateRequest
 */
export interface PayPalValidateRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof PayPalValidateRequest
     */
    'alias'?: string;
}
/**
 * Paysafecard specific request parameters
 * @export
 * @interface PaysafecardRequest
 */
export interface PaysafecardRequest {
    /**
     * The merchantClientId identifies the Customer on Paysafecard\'s side.  Specify the same merchantClientId for all transactions of a specific customer. If no merchantClientId is specified during your init requests, we will apply a random value.  Please refer to the Paysafecard documentation for the guidelines of possible merchantClientIds.
     * @type {string}
     * @memberof PaysafecardRequest
     */
    'merchantClientId'?: string;
}
/**
 * 
 * @export
 * @interface PfcAuthorizeRequest
 */
export interface PfcAuthorizeRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof PfcAuthorizeRequest
     */
    'alias': string;
}
/**
 * 
 * @export
 * @interface PfcInitRequest
 */
export interface PfcInitRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof PfcInitRequest
     */
    'alias'?: string;
}
/**
 * PostFinance Card specific parameters
 * @export
 * @interface PfcValidateRequest
 */
export interface PfcValidateRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof PfcValidateRequest
     */
    'alias': string;
}
/**
 * If PFC was used for a transaction the object holds all Postfinance relevant properties.
 * @export
 * @interface PostfinanceDetail
 */
export interface PostfinanceDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof PostfinanceDetail
     */
    'alias'?: string;
    /**
     * Masked card number. Can be used to display on a users profile page. For example: `****2345`
     * @type {string}
     * @memberof PostfinanceDetail
     */
    'masked'?: string;
    /**
     * The expiry month of the Postfinance card
     * @type {string}
     * @memberof PostfinanceDetail
     */
    'expiryMonth'?: string;
    /**
     * The expiry year of the Postfinance card
     * @type {string}
     * @memberof PostfinanceDetail
     */
    'expiryYear'?: string;
}
/**
 * 
 * @export
 * @interface Purchase
 */
export interface Purchase {
    /**
     * 
     * @type {number}
     * @memberof Purchase
     */
    'purchaseInstalData'?: number;
    /**
     * 
     * @type {MerchantRiskIndicator}
     * @memberof Purchase
     */
    'merchantRiskIndicator'?: MerchantRiskIndicator;
    /**
     * 
     * @type {number}
     * @memberof Purchase
     */
    'purchaseAmount'?: number;
    /**
     * 
     * @type {string}
     * @memberof Purchase
     */
    'purchaseCurrency'?: string;
    /**
     * 
     * @type {number}
     * @memberof Purchase
     */
    'purchaseExponent'?: number;
    /**
     * 
     * @type {string}
     * @memberof Purchase
     */
    'purchaseDate'?: string;
    /**
     * 
     * @type {string}
     * @memberof Purchase
     */
    'recurringExpiry'?: string;
    /**
     * 
     * @type {number}
     * @memberof Purchase
     */
    'recurringFrequency'?: number;
    /**
     * 
     * @type {string}
     * @memberof Purchase
     */
    'transType'?: PurchaseTransTypeEnum;
}

export const PurchaseTransTypeEnum = {
    _01: '01',
    _03: '03',
    _10: '10',
    _11: '11',
    _28: '28'
} as const;

export type PurchaseTransTypeEnum = typeof PurchaseTransTypeEnum[keyof typeof PurchaseTransTypeEnum];

/**
 * 
 * @export
 * @interface ReconciliationsError
 */
export interface ReconciliationsError {
    /**
     * 
     * @type {ReconciliationsErrorCode}
     * @memberof ReconciliationsError
     */
    'code'?: ReconciliationsErrorCode;
    /**
     * A human readable message indicating what went wrong.
     * @type {string}
     * @memberof ReconciliationsError
     */
    'message'?: string;
}
/**
 * 
 * @export
 * @enum {string}
 */

export const ReconciliationsErrorCode = {
    UnknownError: 'UNKNOWN_ERROR',
    Unauthorized: 'UNAUTHORIZED',
    InvalidJsonPayload: 'INVALID_JSON_PAYLOAD',
    UnrecognizedProperty: 'UNRECOGNIZED_PROPERTY',
    InvalidProperty: 'INVALID_PROPERTY',
    ClientError: 'CLIENT_ERROR',
    ServerError: 'SERVER_ERROR',
    TransactionNotFound: 'TRANSACTION_NOT_FOUND'
} as const;

export type ReconciliationsErrorCode = typeof ReconciliationsErrorCode[keyof typeof ReconciliationsErrorCode];


/**
 * The redirect object is used to customize the browser behaviour when using the payment page (Redirect or Lightbox Mode) to do a transaction.
 * @export
 * @interface RedirectRequest
 */
export interface RedirectRequest {
    /**
     * The URL where the customer gets redirected to if the transaction was successful.
     * @type {string}
     * @memberof RedirectRequest
     */
    'successUrl'?: string;
    /**
     * The URL where the customer gets redirected to if the transaction was canceled.
     * @type {string}
     * @memberof RedirectRequest
     */
    'cancelUrl'?: string;
    /**
     * The URL where the customer gets redirected to if an error occurred.
     * @type {string}
     * @memberof RedirectRequest
     */
    'errorUrl'?: string;
    /**
     * If the payment is started within an iframe or when using the Lightbox Mode, use value `_top`. This ensures a proper browser flow for payment methods who need a redirect.
     * @type {string}
     * @memberof RedirectRequest
     */
    'startTarget'?: string;
    /**
     * If the payment is started within an iframe or when using the Lightbox Mode, use `_top` if the redirect URLs should be opened full screen when payment returns from a 3rd party (for example 3D).
     * @type {string}
     * @memberof RedirectRequest
     */
    'returnTarget'?: string;
    /**
     * The preferred HTTP method for the redirect request (`GET` or `POST`). When using GET as a method, the query string parameter `datatransTrxId` will be added to the corresponding return url upon redirection. In case of POST, all the query parameters from the corresponding return url will be moved to the application/x-www-form-urlencoded body of the redirection request along with the added `datatransTrxId` parameter.
     * @type {string}
     * @memberof RedirectRequest
     */
    'method'?: RedirectRequestMethodEnum;
}

export const RedirectRequestMethodEnum = {
    Get: 'GET',
    Post: 'POST'
} as const;

export type RedirectRequestMethodEnum = typeof RedirectRequestMethodEnum[keyof typeof RedirectRequestMethodEnum];

/**
 * If Reka was used for a transaction the object holds all Reka relevant properties.
 * @export
 * @interface RekaDetail
 */
export interface RekaDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof RekaDetail
     */
    'alias'?: string;
    /**
     * Masked REKA number. Can be used to display on a users profile page.
     * @type {string}
     * @memberof RekaDetail
     */
    'masked'?: string;
    /**
     * The expiry month of the REKA card
     * @type {string}
     * @memberof RekaDetail
     */
    'expiryMonth'?: string;
    /**
     * The expiry year of the REKA card
     * @type {string}
     * @memberof RekaDetail
     */
    'expiryYear'?: string;
    /**
     * The REKA payment subtype. REK for REKA Pay, REL for REKA Lunch, RER for REKA Rail.
     * @type {string}
     * @memberof RekaDetail
     */
    'subtype'?: RekaDetailSubtypeEnum;
}

export const RekaDetailSubtypeEnum = {
    Rek: 'REK',
    Rel: 'REL',
    Rer: 'RER'
} as const;

export type RekaDetailSubtypeEnum = typeof RekaDetailSubtypeEnum[keyof typeof RekaDetailSubtypeEnum];

/**
 * Reka card specific parameters
 * @export
 * @interface RekaRequest
 */
export interface RekaRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof RekaRequest
     */
    'alias': string;
    /**
     * The expiry month of the Reka card alias.
     * @type {string}
     * @memberof RekaRequest
     */
    'expiryMonth'?: string;
    /**
     * The expiry year of the Reka card alias
     * @type {string}
     * @memberof RekaRequest
     */
    'expiryYear'?: string;
}
/**
 * A list of sale objects.
 * @export
 * @interface SaleReportRequest
 */
export interface SaleReportRequest {
    /**
     * The date when the transaction happened.
     * @type {string}
     * @memberof SaleReportRequest
     */
    'date'?: string;
    /**
     * The transactionId received after an authorization.
     * @type {string}
     * @memberof SaleReportRequest
     */
    'transactionId'?: string;
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof SaleReportRequest
     */
    'currency'?: string;
    /**
     * The amount of the transaction in the currency’s smallest unit. For example use 1000 for CHF 10.00. 
     * @type {number}
     * @memberof SaleReportRequest
     */
    'amount'?: number;
    /**
     * The type of the transaction
     * @type {string}
     * @memberof SaleReportRequest
     */
    'type'?: SaleReportRequestTypeEnum;
    /**
     * The merchant\'s reference number. It should be unique for each transaction.
     * @type {string}
     * @memberof SaleReportRequest
     */
    'refno'?: string;
}

export const SaleReportRequestTypeEnum = {
    Payment: 'payment',
    Credit: 'credit',
    CardCheck: 'card_check'
} as const;

export type SaleReportRequestTypeEnum = typeof SaleReportRequestTypeEnum[keyof typeof SaleReportRequestTypeEnum];

/**
 * 
 * @export
 * @interface SaleReportResponse
 */
export interface SaleReportResponse {
    /**
     * The transactionId received after an authorization.
     * @type {string}
     * @memberof SaleReportResponse
     */
    'transactionId'?: string;
    /**
     * The date when the sale took place
     * @type {string}
     * @memberof SaleReportResponse
     */
    'saleDate'?: string;
    /**
     * The date when the sale was reported.
     * @type {string}
     * @memberof SaleReportResponse
     */
    'reportedDate'?: string;
    /**
     * The result after trying to match the reported sale.
     * @type {string}
     * @memberof SaleReportResponse
     */
    'matchResult'?: SaleReportResponseMatchResultEnum;
}

export const SaleReportResponseMatchResultEnum = {
    NoMatch: 'NO_MATCH',
    Matched: 'MATCHED',
    Conflict: 'CONFLICT',
    AlreadyMatched: 'ALREADY_MATCHED'
} as const;

export type SaleReportResponseMatchResultEnum = typeof SaleReportResponseMatchResultEnum[keyof typeof SaleReportResponseMatchResultEnum];

/**
 * 
 * @export
 * @interface ScreenRequest
 */
export interface ScreenRequest {
    /**
     * The amount of the transaction in the currency’s smallest unit. For example use 1000 for CHF 10.00. 
     * @type {number}
     * @memberof ScreenRequest
     */
    'amount': number;
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof ScreenRequest
     */
    'currency': string;
    /**
     * The merchant\'s reference number. It should be unique for each transaction.
     * @type {string}
     * @memberof ScreenRequest
     */
    'refno': string;
    /**
     * 
     * @type {CustomerRequest}
     * @memberof ScreenRequest
     */
    'customer'?: CustomerRequest;
    /**
     * 
     * @type {BillingAddress}
     * @memberof ScreenRequest
     */
    'billing'?: BillingAddress;
    /**
     * 
     * @type {ShippingAddress}
     * @memberof ScreenRequest
     */
    'shipping'?: ShippingAddress;
    /**
     * 
     * @type {ByjunoScreenRequest}
     * @memberof ScreenRequest
     */
    'INT'?: ByjunoScreenRequest;
}
/**
 * The `3D` object is only present if init call was done with an `alias`.
 * @export
 * @interface Secure3DResponse
 */
export interface Secure3DResponse {
    /**
     * Whether the used credit card alias (or card number) is 3D enrolled or not.
     * @type {boolean}
     * @memberof Secure3DResponse
     */
    'enrolled'?: boolean;
}
/**
 * 
 * @export
 * @interface SecureFieldsInitRequest
 */
export interface SecureFieldsInitRequest {
    /**
     * The amount of the transaction in the currency’s smallest unit. For example use 1000 for CHF 10.00. 
     * @type {number}
     * @memberof SecureFieldsInitRequest
     */
    'amount'?: number;
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof SecureFieldsInitRequest
     */
    'currency': string;
    /**
     * The URL where the browser will be redirected after the 3D authentication process.
     * @type {string}
     * @memberof SecureFieldsInitRequest
     */
    'returnUrl': string;
    /**
     * 
     * @type {SecureFieldsThreeDSecure}
     * @memberof SecureFieldsInitRequest
     */
    '3D'?: SecureFieldsThreeDSecure;
}
/**
 * 
 * @export
 * @interface SecureFieldsInitResponse
 */
export interface SecureFieldsInitResponse {
    /**
     * The `transactionId` to be used when calling SecureFields.init(). If no further action happens with the `transactionId` after initialization, it will be invalidated after 30 minutes.
     * @type {string}
     * @memberof SecureFieldsInitResponse
     */
    'transactionId'?: string;
}
/**
 * Refer to the official <a href=\'https://www.emvco.com/wp-content/plugins/pmpro-customizations/oy-getfile.php?u=/wp-content/uploads/documents/EMVCo_3DS_Spec_210_1017_0318.pdf\' target=\'_blank\'>EMVCo 3D specification 2.1.0</a> for parameter requirements.
 * @export
 * @interface SecureFieldsThreeDSecure
 */
export interface SecureFieldsThreeDSecure {
    /**
     * 
     * @type {ThreeDSRequestor}
     * @memberof SecureFieldsThreeDSecure
     */
    'threeDSRequestor'?: ThreeDSRequestor;
    /**
     * 
     * @type {string}
     * @memberof SecureFieldsThreeDSecure
     */
    'threeDSRequestorURL'?: string;
    /**
     * 
     * @type {CardholderAccount}
     * @memberof SecureFieldsThreeDSecure
     */
    'cardholderAccount'?: CardholderAccount;
    /**
     * 
     * @type {Cardholder}
     * @memberof SecureFieldsThreeDSecure
     */
    'cardholder'?: Cardholder;
    /**
     * 
     * @type {Purchase}
     * @memberof SecureFieldsThreeDSecure
     */
    'purchase'?: Purchase;
    /**
     * 
     * @type {MerchantData}
     * @memberof SecureFieldsThreeDSecure
     */
    'merchant'?: MerchantData;
    /**
     * 
     * @type {string}
     * @memberof SecureFieldsThreeDSecure
     */
    'broadInfo'?: string;
    /**
     * 
     * @type {Browser}
     * @memberof SecureFieldsThreeDSecure
     */
    'browserInformation'?: Browser;
    /**
     * 
     * @type {string}
     * @memberof SecureFieldsThreeDSecure
     */
    'threeRIInd'?: SecureFieldsThreeDSecureThreeRIIndEnum;
}

export const SecureFieldsThreeDSecureThreeRIIndEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04',
    _05: '05'
} as const;

export type SecureFieldsThreeDSecureThreeRIIndEnum = typeof SecureFieldsThreeDSecureThreeRIIndEnum[keyof typeof SecureFieldsThreeDSecureThreeRIIndEnum];

/**
 * 
 * @export
 * @interface SecureFieldsUpdateRequest
 */
export interface SecureFieldsUpdateRequest {
    /**
     * The newly to be used amount in the currency’s smallest unit. For example use 1000 for CHF 10.00.
     * @type {number}
     * @memberof SecureFieldsUpdateRequest
     */
    'amount'?: number;
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof SecureFieldsUpdateRequest
     */
    'currency': string;
}
/**
 * 
 * @export
 * @interface SettleDetail
 */
export interface SettleDetail {
    /**
     * The settled amount.
     * @type {number}
     * @memberof SettleDetail
     */
    'amount'?: number;
}
/**
 * 
 * @export
 * @interface SettleRequest
 */
export interface SettleRequest {
    /**
     * The amount of the transaction in the currency’s smallest unit. For example use 1000 for CHF 10.00. 
     * @type {number}
     * @memberof SettleRequest
     */
    'amount': number;
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof SettleRequest
     */
    'currency': string;
    /**
     * The merchant\'s reference number. Most payment methods require you to have a unique reference for a transaction. In case you must change the reference number in settlement, ensure first it is supported by the dedicated payment method.
     * @type {string}
     * @memberof SettleRequest
     */
    'refno': string;
    /**
     * Optional customer\'s reference number. Supported by some payment methods or acquirers.
     * @type {string}
     * @memberof SettleRequest
     */
    'refno2'?: string;
    /**
     * 
     * @type {AirlineDataRequest}
     * @memberof SettleRequest
     */
    'airlineData'?: AirlineDataRequest;
    /**
     * 
     * @type {MarketPlaceSettle}
     * @memberof SettleRequest
     */
    'marketplace'?: MarketPlaceSettle;
    /**
     * An object for additional data needed by some merchants for customized processes.
     * @type {object}
     * @memberof SettleRequest
     */
    'extensions'?: object;
}
/**
 * The address where the article(s) should be sent to.
 * @export
 * @interface ShippingAddress
 */
export interface ShippingAddress {
    /**
     * Gender of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'gender'?: string;
    /**
     * Title of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'title'?: string;
    /**
     * Name of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'name'?: string;
    /**
     * First name of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'firstName'?: string;
    /**
     * Last name of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'lastName'?: string;
    /**
     * Email of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'email'?: string;
    /**
     * Street of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'street'?: string;
    /**
     * Secondary street name of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'street2'?: string;
    /**
     * Postal code of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'zipCode'?: string;
    /**
     * City of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'city'?: string;
    /**
     * <a href=\'https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3\' target=\'_blank\'>ISO 3166-1 alpha-3</a> country code of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'country'?: string;
    /**
     * Country subdivision of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'countrySubdivision'?: string;
    /**
     * The sorting code of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'sortingCode'?: string;
    /**
     * Phone number of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'phone'?: string;
    /**
     * Cell phone number of the person
     * @type {string}
     * @memberof ShippingAddress
     */
    'cellPhone'?: string;
    /**
     * Shipping carrier to be used. For example: `DHL`, `Express`
     * @type {string}
     * @memberof ShippingAddress
     */
    'carrier'?: string;
    /**
     * Value of all items in the basket, in smallest available unit.
     * @type {number}
     * @memberof ShippingAddress
     */
    'price'?: number;
    /**
     * Gross value of all items in the basket, in smallest available unit.
     * @type {number}
     * @memberof ShippingAddress
     */
    'priceGross'?: number;
}
/**
 * 
 * @export
 * @interface StatusResponse
 */
export interface StatusResponse {
    /**
     * The transactionId received after an authorization.
     * @type {string}
     * @memberof StatusResponse
     */
    'transactionId'?: string;
    /**
     * 
     * @type {string}
     * @memberof StatusResponse
     */
    'type'?: StatusResponseTypeEnum;
    /**
     * 
     * @type {string}
     * @memberof StatusResponse
     */
    'status'?: StatusResponseStatusEnum;
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof StatusResponse
     */
    'currency'?: string;
    /**
     * The merchant\'s reference number. It should be unique for each transaction.
     * @type {string}
     * @memberof StatusResponse
     */
    'refno'?: string;
    /**
     * Optional customer\'s reference number. Supported by some payment methods or acquirers.
     * @type {string}
     * @memberof StatusResponse
     */
    'refno2'?: string;
    /**
     * 
     * @type {string}
     * @memberof StatusResponse
     */
    'paymentMethod'?: StatusResponsePaymentMethodEnum;
    /**
     * 
     * @type {Detail}
     * @memberof StatusResponse
     */
    'detail'?: Detail;
    /**
     * 
     * @type {Customer}
     * @memberof StatusResponse
     */
    'customer'?: Customer;
    /**
     * The response of the cybersource decision manager.
     * @type {object}
     * @memberof StatusResponse
     */
    'cdm'?: object;
    /**
     * The language (language code) in which the payment was presented to the cardholder. The <a href=\'https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes\' target=\'_blank\'>ISO-639-1</a> two letter language codes listed above are supported
     * @type {string}
     * @memberof StatusResponse
     */
    'language'?: StatusResponseLanguageEnum;
    /**
     * 
     * @type {CardDetail}
     * @memberof StatusResponse
     */
    'card'?: CardDetail;
    /**
     * 
     * @type {TwintDetail}
     * @memberof StatusResponse
     */
    'TWI'?: TwintDetail;
    /**
     * 
     * @type {PayPalDetail}
     * @memberof StatusResponse
     */
    'PAP'?: PayPalDetail;
    /**
     * 
     * @type {RekaDetail}
     * @memberof StatusResponse
     */
    'REK'?: RekaDetail;
    /**
     * 
     * @type {ElvDetail}
     * @memberof StatusResponse
     */
    'ELV'?: ElvDetail;
    /**
     * 
     * @type {KlarnaDetail}
     * @memberof StatusResponse
     */
    'KLN'?: KlarnaDetail;
    /**
     * 
     * @type {ByjunoDetail}
     * @memberof StatusResponse
     */
    'INT'?: ByjunoDetail;
    /**
     * 
     * @type {SwissPassDetail}
     * @memberof StatusResponse
     */
    'SWP'?: SwissPassDetail;
    /**
     * 
     * @type {MFXDetail}
     * @memberof StatusResponse
     */
    'MFX'?: MFXDetail;
    /**
     * 
     * @type {MPXDetail}
     * @memberof StatusResponse
     */
    'MPX'?: MPXDetail;
    /**
     * 
     * @type {MDPDetail}
     * @memberof StatusResponse
     */
    'MDP'?: MDPDetail;
    /**
     * 
     * @type {SwisscomPayDetail}
     * @memberof StatusResponse
     */
    'ESY'?: SwisscomPayDetail;
    /**
     * 
     * @type {PostfinanceDetail}
     * @memberof StatusResponse
     */
    'PFC'?: PostfinanceDetail;
    /**
     * 
     * @type {WeChatDetail}
     * @memberof StatusResponse
     */
    'WEC'?: WeChatDetail;
    /**
     * 
     * @type {SuperCard}
     * @memberof StatusResponse
     */
    'SCX'?: SuperCard;
    /**
     * 
     * @type {Array<Action>}
     * @memberof StatusResponse
     */
    'history'?: Array<Action>;
    /**
     * 
     * @type {Ep2}
     * @memberof StatusResponse
     */
    'ep2'?: Ep2;
    /**
     * 
     * @type {Dcc}
     * @memberof StatusResponse
     */
    'dcc'?: Dcc;
}

export const StatusResponseTypeEnum = {
    Payment: 'payment',
    Credit: 'credit',
    CardCheck: 'card_check'
} as const;

export type StatusResponseTypeEnum = typeof StatusResponseTypeEnum[keyof typeof StatusResponseTypeEnum];
export const StatusResponseStatusEnum = {
    Initialized: 'initialized',
    ChallengeRequired: 'challenge_required',
    ChallengeOngoing: 'challenge_ongoing',
    Authenticated: 'authenticated',
    Authorized: 'authorized',
    Settled: 'settled',
    Canceled: 'canceled',
    Transmitted: 'transmitted',
    Failed: 'failed'
} as const;

export type StatusResponseStatusEnum = typeof StatusResponseStatusEnum[keyof typeof StatusResponseStatusEnum];
export const StatusResponsePaymentMethodEnum = {
    Acc: 'ACC',
    Alp: 'ALP',
    Apl: 'APL',
    Amx: 'AMX',
    Azp: 'AZP',
    Bon: 'BON',
    Cfy: 'CFY',
    Csy: 'CSY',
    Cup: 'CUP',
    Dea: 'DEA',
    Din: 'DIN',
    Dii: 'DII',
    Dib: 'DIB',
    Dis: 'DIS',
    Dnk: 'DNK',
    Eca: 'ECA',
    Elv: 'ELV',
    Eps: 'EPS',
    Esy: 'ESY',
    Gpa: 'GPA',
    Int: 'INT',
    Jcb: 'JCB',
    Jel: 'JEL',
    Kln: 'KLN',
    Mau: 'MAU',
    Mdp: 'MDP',
    Mfx: 'MFX',
    Mpx: 'MPX',
    Myo: 'MYO',
    Pap: 'PAP',
    Pay: 'PAY',
    Pef: 'PEF',
    Pfc: 'PFC',
    Psc: 'PSC',
    Rek: 'REK',
    Sam: 'SAM',
    Swb: 'SWB',
    Scx: 'SCX',
    Swp: 'SWP',
    Twi: 'TWI',
    Uap: 'UAP',
    Vis: 'VIS',
    Wec: 'WEC'
} as const;

export type StatusResponsePaymentMethodEnum = typeof StatusResponsePaymentMethodEnum[keyof typeof StatusResponsePaymentMethodEnum];
export const StatusResponseLanguageEnum = {
    En: 'en',
    De: 'de',
    Fr: 'fr',
    It: 'it',
    Es: 'es',
    El: 'el',
    No: 'no',
    Da: 'da',
    Pl: 'pl',
    Pt: 'pt',
    Ru: 'ru',
    Ja: 'ja'
} as const;

export type StatusResponseLanguageEnum = typeof StatusResponseLanguageEnum[keyof typeof StatusResponseLanguageEnum];

/**
 * Supercard specific parameters.
 * @export
 * @interface SuperCard
 */
export interface SuperCard {
    /**
     * The SCX payment subtype. SCM for Mastercard, SCV for Visa and SCP for Visa prepaid
     * @type {string}
     * @memberof SuperCard
     */
    'subtype'?: SuperCardSubtypeEnum;
}

export const SuperCardSubtypeEnum = {
    Scm: 'SCM',
    Scv: 'SCV',
    Scp: 'SCP'
} as const;

export type SuperCardSubtypeEnum = typeof SuperCardSubtypeEnum[keyof typeof SuperCardSubtypeEnum];

/**
 * 
 * @export
 * @interface SwissBillingAuthorizeRequest
 */
export interface SwissBillingAuthorizeRequest {
    /**
     * 
     * @type {number}
     * @memberof SwissBillingAuthorizeRequest
     */
    'paymentPeriod'?: number;
    /**
     * 
     * @type {string}
     * @memberof SwissBillingAuthorizeRequest
     */
    'customerSubscription': string;
}
/**
 * Swissbilling specific parameters.
 * @export
 * @interface SwissBillingRequest
 */
export interface SwissBillingRequest {
    /**
     * 
     * @type {number}
     * @memberof SwissBillingRequest
     */
    'paymentPeriod'?: number;
}
/**
 * If SWP was used for a transaction the object holds all SwissPass relevant properties.
 * @export
 * @interface SwissPassDetail
 */
export interface SwissPassDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof SwissPassDetail
     */
    'alias'?: string;
}
/**
 * SwissPass specific parameters
 * @export
 * @interface SwissPassRequest
 */
export interface SwissPassRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof SwissPassRequest
     */
    'alias': string;
    /**
     * The card number.
     * @type {string}
     * @memberof SwissPassRequest
     */
    'card'?: string;
    /**
     * The zip code.
     * @type {string}
     * @memberof SwissPassRequest
     */
    'zip'?: string;
}
/**
 * If ESY was used for a transaction the object holds all Swisscom Pay relevant properties.
 * @export
 * @interface SwisscomPayDetail
 */
export interface SwisscomPayDetail {
    /**
     * The resulting alias, if requested or available.
     * @type {string}
     * @memberof SwisscomPayDetail
     */
    'alias'?: string;
}
/**
 * The theme (including configuration options) to be used when rendering the payment page.
 * @export
 * @interface Theme
 */
export interface Theme {
    /**
     * 
     * @type {ThemeConfiguration}
     * @memberof Theme
     */
    'configuration'?: ThemeConfiguration;
}
/**
 * Theme configuration options when using the default `DT2015` theme
 * @export
 * @interface ThemeConfiguration
 */
export interface ThemeConfiguration {
    /**
     * Hex notation of a color
     * @type {string}
     * @memberof ThemeConfiguration
     */
    'brandColor'?: string;
    /**
     * The color of the text in the header bar if no logo is given
     * @type {string}
     * @memberof ThemeConfiguration
     */
    'textColor'?: ThemeConfigurationTextColorEnum;
    /**
     * The header logo\'s display style
     * @type {string}
     * @memberof ThemeConfiguration
     */
    'logoType'?: ThemeConfigurationLogoTypeEnum;
    /**
     * Decides whether the logo shall be styled with a border around it, if the value is true the default background color is chosen, else the provided string is used as color value
     * @type {string}
     * @memberof ThemeConfiguration
     */
    'logoBorderColor'?: string;
    /**
     * Decides if the pay button should have the same color as the brandColor. If set to false the hex color #01669F will be used as a default
     * @type {string}
     * @memberof ThemeConfiguration
     */
    'brandButton'?: string;
    /**
     * The color (hex) of the pay button
     * @type {string}
     * @memberof ThemeConfiguration
     */
    'payButtonTextColor'?: string;
    /**
     * An SVG image provided by the merchant. The image needs to be uploaded by using the Datatrans Web Administration Tool
     * @type {string}
     * @memberof ThemeConfiguration
     */
    'logoSrc'?: string;
    /**
     * Wheter the payment page shows the payment method selection as list (default) or as a grid
     * @type {string}
     * @memberof ThemeConfiguration
     */
    'initialView'?: ThemeConfigurationInitialViewEnum;
    /**
     * If set to `false` and no logo is used (see `logoSrc`), the payment page header will be empty
     * @type {boolean}
     * @memberof ThemeConfiguration
     */
    'brandTitle'?: boolean;
}

export const ThemeConfigurationTextColorEnum = {
    White: 'white',
    Black: 'black'
} as const;

export type ThemeConfigurationTextColorEnum = typeof ThemeConfigurationTextColorEnum[keyof typeof ThemeConfigurationTextColorEnum];
export const ThemeConfigurationLogoTypeEnum = {
    Circle: 'circle',
    Rectangle: 'rectangle',
    None: 'none'
} as const;

export type ThemeConfigurationLogoTypeEnum = typeof ThemeConfigurationLogoTypeEnum[keyof typeof ThemeConfigurationLogoTypeEnum];
export const ThemeConfigurationInitialViewEnum = {
    List: 'list',
    Grid: 'grid'
} as const;

export type ThemeConfigurationInitialViewEnum = typeof ThemeConfigurationInitialViewEnum[keyof typeof ThemeConfigurationInitialViewEnum];

/**
 * 
 * @export
 * @interface ThreeDSRequestor
 */
export interface ThreeDSRequestor {
    /**
     * 
     * @type {string}
     * @memberof ThreeDSRequestor
     */
    'threeDSRequestorAuthenticationInd'?: ThreeDSRequestorThreeDSRequestorAuthenticationIndEnum;
    /**
     * 
     * @type {ThreeDSRequestorAuthenticationInformation}
     * @memberof ThreeDSRequestor
     */
    'threeDSRequestorAuthenticationInfo'?: ThreeDSRequestorAuthenticationInformation;
    /**
     * 
     * @type {string}
     * @memberof ThreeDSRequestor
     */
    'threeDSRequestorChallengeInd'?: ThreeDSRequestorThreeDSRequestorChallengeIndEnum;
    /**
     * 
     * @type {string}
     * @memberof ThreeDSRequestor
     */
    'threeDSRequestorDecReqInd'?: ThreeDSRequestorThreeDSRequestorDecReqIndEnum;
    /**
     * 
     * @type {number}
     * @memberof ThreeDSRequestor
     */
    'threeDSRequestorDecMaxTime'?: number;
}

export const ThreeDSRequestorThreeDSRequestorAuthenticationIndEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04',
    _05: '05',
    _06: '06'
} as const;

export type ThreeDSRequestorThreeDSRequestorAuthenticationIndEnum = typeof ThreeDSRequestorThreeDSRequestorAuthenticationIndEnum[keyof typeof ThreeDSRequestorThreeDSRequestorAuthenticationIndEnum];
export const ThreeDSRequestorThreeDSRequestorChallengeIndEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04',
    _05: '05',
    _06: '06',
    _07: '07',
    _08: '08',
    _09: '09'
} as const;

export type ThreeDSRequestorThreeDSRequestorChallengeIndEnum = typeof ThreeDSRequestorThreeDSRequestorChallengeIndEnum[keyof typeof ThreeDSRequestorThreeDSRequestorChallengeIndEnum];
export const ThreeDSRequestorThreeDSRequestorDecReqIndEnum = {
    Y: 'Y',
    N: 'N'
} as const;

export type ThreeDSRequestorThreeDSRequestorDecReqIndEnum = typeof ThreeDSRequestorThreeDSRequestorDecReqIndEnum[keyof typeof ThreeDSRequestorThreeDSRequestorDecReqIndEnum];

/**
 * 
 * @export
 * @interface ThreeDSRequestorAuthenticationInformation
 */
export interface ThreeDSRequestorAuthenticationInformation {
    /**
     * 
     * @type {string}
     * @memberof ThreeDSRequestorAuthenticationInformation
     */
    'threeDSReqAuthMethod'?: ThreeDSRequestorAuthenticationInformationThreeDSReqAuthMethodEnum;
    /**
     * 
     * @type {string}
     * @memberof ThreeDSRequestorAuthenticationInformation
     */
    'threeDSReqAuthTimestamp'?: string;
    /**
     * 
     * @type {string}
     * @memberof ThreeDSRequestorAuthenticationInformation
     */
    'threeDSReqAuthData'?: string;
}

export const ThreeDSRequestorAuthenticationInformationThreeDSReqAuthMethodEnum = {
    _01: '01',
    _02: '02',
    _03: '03',
    _04: '04',
    _05: '05',
    _06: '06'
} as const;

export type ThreeDSRequestorAuthenticationInformationThreeDSReqAuthMethodEnum = typeof ThreeDSRequestorAuthenticationInformationThreeDSReqAuthMethodEnum[keyof typeof ThreeDSRequestorAuthenticationInformationThreeDSReqAuthMethodEnum];

/**
 * A list of tickets for this purchase. Note: PAP only supports one ticket.
 * @export
 * @interface Ticket
 */
export interface Ticket {
    /**
     * the number of the ticket
     * @type {string}
     * @memberof Ticket
     */
    'ticketNumber'?: string;
    /**
     * Name of passenger or person to whom the ticket was issued
     * @type {string}
     * @memberof Ticket
     */
    'passengerName'?: string;
    /**
     * Description code
     * @type {string}
     * @memberof Ticket
     */
    'descriptionCode'?: string;
    /**
     * List of ticket\'s legs
     * @type {Array<Leg>}
     * @memberof Ticket
     */
    'legs'?: Array<Leg>;
}
/**
 * 
 * @export
 * @interface TransactionsError
 */
export interface TransactionsError {
    /**
     * 
     * @type {TransactionsErrorCode}
     * @memberof TransactionsError
     */
    'code'?: TransactionsErrorCode;
    /**
     * A human readable message indicating what went wrong.
     * @type {string}
     * @memberof TransactionsError
     */
    'message'?: string;
}
/**
 * 
 * @export
 * @enum {string}
 */

export const TransactionsErrorCode = {
    UnknownError: 'UNKNOWN_ERROR',
    Unauthorized: 'UNAUTHORIZED',
    InvalidJsonPayload: 'INVALID_JSON_PAYLOAD',
    UnrecognizedProperty: 'UNRECOGNIZED_PROPERTY',
    InvalidProperty: 'INVALID_PROPERTY',
    ClientError: 'CLIENT_ERROR',
    ServerError: 'SERVER_ERROR',
    InvalidTransactionStatus: 'INVALID_TRANSACTION_STATUS',
    TransactionNotFound: 'TRANSACTION_NOT_FOUND',
    ExpiredCard: 'EXPIRED_CARD',
    InvalidCard: 'INVALID_CARD',
    BlockedCard: 'BLOCKED_CARD',
    UnsupportedCard: 'UNSUPPORTED_CARD',
    InvalidAlias: 'INVALID_ALIAS',
    InvalidCvv: 'INVALID_CVV',
    DuplicateRefno: 'DUPLICATE_REFNO',
    Declined: 'DECLINED',
    SoftDeclined: 'SOFT_DECLINED',
    InvalidSign: 'INVALID_SIGN',
    BlockedByVelocityChecker: 'BLOCKED_BY_VELOCITY_CHECKER',
    ThirdPartyError: 'THIRD_PARTY_ERROR',
    Referral: 'REFERRAL',
    InvalidSetup: 'INVALID_SETUP'
} as const;

export type TransactionsErrorCode = typeof TransactionsErrorCode[keyof typeof TransactionsErrorCode];


/**
 * 
 * @export
 * @interface TransactionsResponseBase
 */
export interface TransactionsResponseBase {
    /**
     * 
     * @type {TransactionsError}
     * @memberof TransactionsResponseBase
     */
    'error'?: TransactionsError;
}
/**
 * 
 * @export
 * @interface TwintAuthorizeRequest
 */
export interface TwintAuthorizeRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof TwintAuthorizeRequest
     */
    'alias'?: string;
}
/**
 * If Twint was used for a transaction the object holds all Twint relevant properties.
 * @export
 * @interface TwintDetail
 */
export interface TwintDetail {
    /**
     * The Twint alias.
     * @type {string}
     * @memberof TwintDetail
     */
    'alias'?: string;
}
/**
 * Twint specific parameters
 * @export
 * @interface TwintRequest
 */
export interface TwintRequest {
    /**
     * Alias received for example from a previous transaction if `option.createAlias: true` was used. In order to retrieve the alias from a previous transaction, use the [Status API](#operation/status).
     * @type {string}
     * @memberof TwintRequest
     */
    'alias'?: string;
}
/**
 * 
 * @export
 * @interface ValidateRequest
 */
export interface ValidateRequest {
    /**
     * The merchant\'s reference number. It should be unique for each transaction.
     * @type {string}
     * @memberof ValidateRequest
     */
    'refno': string;
    /**
     * Optional customer\'s reference number. Supported by some payment methods or acquirers.
     * @type {string}
     * @memberof ValidateRequest
     */
    'refno2'?: string;
    /**
     * 3 letter <a href=\'https://en.wikipedia.org/wiki/ISO_4217\' target=\'_blank\'>ISO-4217</a> character code. For example `CHF` or `USD`
     * @type {string}
     * @memberof ValidateRequest
     */
    'currency': string;
    /**
     * 
     * @type {CardValidateRequest}
     * @memberof ValidateRequest
     */
    'card'?: CardValidateRequest;
    /**
     * 
     * @type {PfcValidateRequest}
     * @memberof ValidateRequest
     */
    'PFC'?: PfcValidateRequest;
    /**
     * 
     * @type {KlarnaValidateRequest}
     * @memberof ValidateRequest
     */
    'KLN'?: KlarnaValidateRequest;
    /**
     * 
     * @type {PayPalValidateRequest}
     * @memberof ValidateRequest
     */
    'PAP'?: PayPalValidateRequest;
    /**
     * 
     * @type {GooglePayValidateRequest}
     * @memberof ValidateRequest
     */
    'PAY'?: GooglePayValidateRequest;
    /**
     * 
     * @type {ApplePayValidateRequest}
     * @memberof ValidateRequest
     */
    'APL'?: ApplePayValidateRequest;
    /**
     * 
     * @type {EasyPayValidateRequest}
     * @memberof ValidateRequest
     */
    'ESY'?: EasyPayValidateRequest;
}
/**
 * If WEC was used for a transaction the object holds all WeChat relevant properties.
 * @export
 * @interface WeChatDetail
 */
export interface WeChatDetail {
    /**
     * 
     * @type {string}
     * @memberof WeChatDetail
     */
    'prepayId'?: string;
}
/**
 * WeChat specific parameters
 * @export
 * @interface WeChatRequest
 */
export interface WeChatRequest {
    /**
     * The WeChat specific payment method used for the transaction.
     * @type {string}
     * @memberof WeChatRequest
     */
    'subtype': WeChatRequestSubtypeEnum;
    /**
     * 
     * @type {string}
     * @memberof WeChatRequest
     */
    'openId'?: string;
    /**
     * 
     * @type {string}
     * @memberof WeChatRequest
     */
    'itemDescription'?: string;
}

export const WeChatRequestSubtypeEnum = {
    MiniApp: 'MINI_APP'
} as const;

export type WeChatRequestSubtypeEnum = typeof WeChatRequestSubtypeEnum[keyof typeof WeChatRequestSubtypeEnum];

/**
 * WeChat specific response parameters
 * @export
 * @interface WeChatResponse
 */
export interface WeChatResponse {
    /**
     * The order prepayId. To be used by the Mini APP in the payment confirmation process.
     * @type {string}
     * @memberof WeChatResponse
     */
    'prepayId'?: string;
    /**
     * 
     * @type {string}
     * @memberof WeChatResponse
     */
    'timestamp'?: string;
    /**
     * 
     * @type {string}
     * @memberof WeChatResponse
     */
    'nonceString'?: string;
    /**
     * 
     * @type {string}
     * @memberof WeChatResponse
     */
    'paySign'?: string;
}

/**
 * V1AliasesApi - axios parameter creator
 * @export
 */
export const V1AliasesApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * Convert a legacy (numeric or masked) alias to the most recent alias format. Currently, only credit card aliases can be converted.
         * @summary Convert alias
         * @param {AliasConvertRequest} aliasConvertRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        aliasesConvert: async (aliasConvertRequest: AliasConvertRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'aliasConvertRequest' is not null or undefined
            assertParamExists('aliasesConvert', 'aliasConvertRequest', aliasConvertRequest)
            const localVarPath = `/v1/aliases`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(aliasConvertRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Delete an alias with immediate effect. The alias will no longer be recognized if used later with any API call.
         * @summary Delete alias
         * @param {string} alias 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        aliasesDelete: async (alias: string, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'alias' is not null or undefined
            assertParamExists('aliasesDelete', 'alias', alias)
            const localVarPath = `/v1/aliases/{alias}`
                .replace(`{${"alias"}}`, encodeURIComponent(String(alias)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Get alias info.
         * @summary Get alias info
         * @param {string} alias 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        aliasesInfo: async (alias: string, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'alias' is not null or undefined
            assertParamExists('aliasesInfo', 'alias', alias)
            const localVarPath = `/v1/aliases/{alias}`
                .replace(`{${"alias"}}`, encodeURIComponent(String(alias)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * V1AliasesApi - functional programming interface
 * @export
 */
export const V1AliasesApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = V1AliasesApiAxiosParamCreator(configuration)
    return {
        /**
         * Convert a legacy (numeric or masked) alias to the most recent alias format. Currently, only credit card aliases can be converted.
         * @summary Convert alias
         * @param {AliasConvertRequest} aliasConvertRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async aliasesConvert(aliasConvertRequest: AliasConvertRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AliasConvertResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.aliasesConvert(aliasConvertRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Delete an alias with immediate effect. The alias will no longer be recognized if used later with any API call.
         * @summary Delete alias
         * @param {string} alias 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async aliasesDelete(alias: string, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.aliasesDelete(alias, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Get alias info.
         * @summary Get alias info
         * @param {string} alias 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async aliasesInfo(alias: string, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AliasInfoResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.aliasesInfo(alias, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * V1AliasesApi - factory interface
 * @export
 */
export const V1AliasesApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = V1AliasesApiFp(configuration)
    return {
        /**
         * Convert a legacy (numeric or masked) alias to the most recent alias format. Currently, only credit card aliases can be converted.
         * @summary Convert alias
         * @param {AliasConvertRequest} aliasConvertRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        aliasesConvert(aliasConvertRequest: AliasConvertRequest, options?: any): AxiosPromise<AliasConvertResponse> {
            return localVarFp.aliasesConvert(aliasConvertRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * Delete an alias with immediate effect. The alias will no longer be recognized if used later with any API call.
         * @summary Delete alias
         * @param {string} alias 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        aliasesDelete(alias: string, options?: any): AxiosPromise<void> {
            return localVarFp.aliasesDelete(alias, options).then((request) => request(axios, basePath));
        },
        /**
         * Get alias info.
         * @summary Get alias info
         * @param {string} alias 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        aliasesInfo(alias: string, options?: any): AxiosPromise<AliasInfoResponse> {
            return localVarFp.aliasesInfo(alias, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * V1AliasesApi - object-oriented interface
 * @export
 * @class V1AliasesApi
 * @extends {BaseAPI}
 */
export class V1AliasesApi extends BaseAPI {
    /**
     * Convert a legacy (numeric or masked) alias to the most recent alias format. Currently, only credit card aliases can be converted.
     * @summary Convert alias
     * @param {AliasConvertRequest} aliasConvertRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1AliasesApi
     */
    public aliasesConvert(aliasConvertRequest: AliasConvertRequest, options?: AxiosRequestConfig) {
        return V1AliasesApiFp(this.configuration).aliasesConvert(aliasConvertRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Delete an alias with immediate effect. The alias will no longer be recognized if used later with any API call.
     * @summary Delete alias
     * @param {string} alias 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1AliasesApi
     */
    public aliasesDelete(alias: string, options?: AxiosRequestConfig) {
        return V1AliasesApiFp(this.configuration).aliasesDelete(alias, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get alias info.
     * @summary Get alias info
     * @param {string} alias 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1AliasesApi
     */
    public aliasesInfo(alias: string, options?: AxiosRequestConfig) {
        return V1AliasesApiFp(this.configuration).aliasesInfo(alias, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * V1OpenapiApi - axios parameter creator
 * @export
 */
export const V1OpenapiApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        get: async (options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            const localVarPath = `/v1/openapi`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * V1OpenapiApi - functional programming interface
 * @export
 */
export const V1OpenapiApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = V1OpenapiApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async get(options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.get(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * V1OpenapiApi - factory interface
 * @export
 */
export const V1OpenapiApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = V1OpenapiApiFp(configuration)
    return {
        /**
         * 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        get(options?: any): AxiosPromise<void> {
            return localVarFp.get(options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * V1OpenapiApi - object-oriented interface
 * @export
 * @class V1OpenapiApi
 * @extends {BaseAPI}
 */
export class V1OpenapiApi extends BaseAPI {
    /**
     * 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1OpenapiApi
     */
    public get(options?: AxiosRequestConfig) {
        return V1OpenapiApiFp(this.configuration).get(options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * V1ReconciliationsApi - axios parameter creator
 * @export
 */
export const V1ReconciliationsApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * If you are a merchant using our reconciliation services, you can use this API to confirm multiple sales with a single API call. The matching is based on the `transactionId`. The status of the transaction will change to `compensated`
         * @summary Bulk reporting of sales
         * @param {BulkSaleReportRequest} bulkSaleReportRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        bulkSaleReport: async (bulkSaleReportRequest: BulkSaleReportRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'bulkSaleReportRequest' is not null or undefined
            assertParamExists('bulkSaleReport', 'bulkSaleReportRequest', bulkSaleReportRequest)
            const localVarPath = `/v1/reconciliations/sales/bulk`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(bulkSaleReportRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * If you are a merchant using our reconciliation services, you can use this API to confirm a sale. The matching is based on the `transactionId`. The status of the transaction will change to `compensated`
         * @summary Report a sale
         * @param {SaleReportRequest} saleReportRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        saleReport: async (saleReportRequest: SaleReportRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'saleReportRequest' is not null or undefined
            assertParamExists('saleReport', 'saleReportRequest', saleReportRequest)
            const localVarPath = `/v1/reconciliations/sales`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(saleReportRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * V1ReconciliationsApi - functional programming interface
 * @export
 */
export const V1ReconciliationsApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = V1ReconciliationsApiAxiosParamCreator(configuration)
    return {
        /**
         * If you are a merchant using our reconciliation services, you can use this API to confirm multiple sales with a single API call. The matching is based on the `transactionId`. The status of the transaction will change to `compensated`
         * @summary Bulk reporting of sales
         * @param {BulkSaleReportRequest} bulkSaleReportRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async bulkSaleReport(bulkSaleReportRequest: BulkSaleReportRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<SaleReportResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.bulkSaleReport(bulkSaleReportRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * If you are a merchant using our reconciliation services, you can use this API to confirm a sale. The matching is based on the `transactionId`. The status of the transaction will change to `compensated`
         * @summary Report a sale
         * @param {SaleReportRequest} saleReportRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async saleReport(saleReportRequest: SaleReportRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<SaleReportResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.saleReport(saleReportRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * V1ReconciliationsApi - factory interface
 * @export
 */
export const V1ReconciliationsApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = V1ReconciliationsApiFp(configuration)
    return {
        /**
         * If you are a merchant using our reconciliation services, you can use this API to confirm multiple sales with a single API call. The matching is based on the `transactionId`. The status of the transaction will change to `compensated`
         * @summary Bulk reporting of sales
         * @param {BulkSaleReportRequest} bulkSaleReportRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        bulkSaleReport(bulkSaleReportRequest: BulkSaleReportRequest, options?: any): AxiosPromise<SaleReportResponse> {
            return localVarFp.bulkSaleReport(bulkSaleReportRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * If you are a merchant using our reconciliation services, you can use this API to confirm a sale. The matching is based on the `transactionId`. The status of the transaction will change to `compensated`
         * @summary Report a sale
         * @param {SaleReportRequest} saleReportRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        saleReport(saleReportRequest: SaleReportRequest, options?: any): AxiosPromise<SaleReportResponse> {
            return localVarFp.saleReport(saleReportRequest, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * V1ReconciliationsApi - object-oriented interface
 * @export
 * @class V1ReconciliationsApi
 * @extends {BaseAPI}
 */
export class V1ReconciliationsApi extends BaseAPI {
    /**
     * If you are a merchant using our reconciliation services, you can use this API to confirm multiple sales with a single API call. The matching is based on the `transactionId`. The status of the transaction will change to `compensated`
     * @summary Bulk reporting of sales
     * @param {BulkSaleReportRequest} bulkSaleReportRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1ReconciliationsApi
     */
    public bulkSaleReport(bulkSaleReportRequest: BulkSaleReportRequest, options?: AxiosRequestConfig) {
        return V1ReconciliationsApiFp(this.configuration).bulkSaleReport(bulkSaleReportRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * If you are a merchant using our reconciliation services, you can use this API to confirm a sale. The matching is based on the `transactionId`. The status of the transaction will change to `compensated`
     * @summary Report a sale
     * @param {SaleReportRequest} saleReportRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1ReconciliationsApi
     */
    public saleReport(saleReportRequest: SaleReportRequest, options?: AxiosRequestConfig) {
        return V1ReconciliationsApiFp(this.configuration).saleReport(saleReportRequest, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * V1TransactionsApi - axios parameter creator
 * @export
 */
export const V1TransactionsApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * To create a transaction without user interaction, send all required parameters to our authorize endpoint. This is the API call for merchant-initiated transactions with an existing `alias`. Depending on the payment method, additional parameters will be required. Refer to the payment method specific objects (for example `PAP`) to see which parameters are required additionally send. For credit cards, the `card` object has to be used
         * @summary Authorize a transaction
         * @param {AuthorizeRequest} authorizeRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        authorize: async (authorizeRequest: AuthorizeRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'authorizeRequest' is not null or undefined
            assertParamExists('authorize', 'authorizeRequest', authorizeRequest)
            const localVarPath = `/v1/transactions/authorize`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(authorizeRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Use this API endpoint to fully authorize an already authenticated transaction. This call is required for any transaction done with our Secure Fields or if during the initialization of a transaction the parameter `option.authenticationOnly` was set to `true`
         * @summary Authorize an authenticated transaction
         * @param {number} transactionId 
         * @param {AuthorizeSplitRequest} authorizeSplitRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        authorizeSplit: async (transactionId: number, authorizeSplitRequest: AuthorizeSplitRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'transactionId' is not null or undefined
            assertParamExists('authorizeSplit', 'transactionId', transactionId)
            // verify required parameter 'authorizeSplitRequest' is not null or undefined
            assertParamExists('authorizeSplit', 'authorizeSplitRequest', authorizeSplitRequest)
            const localVarPath = `/v1/transactions/{transactionId}/authorize`
                .replace(`{${"transactionId"}}`, encodeURIComponent(String(transactionId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(authorizeSplitRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Cancel requests can be used to release a blocked amount from an authorization. The transaction must either be in status `authorized` or `settled`. The `transactionId` is needed to cancel an authorization
         * @summary Cancel a transaction
         * @param {number} transactionId 
         * @param {CancelRequest} cancelRequest Cancel a transaction
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        cancel: async (transactionId: number, cancelRequest: CancelRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'transactionId' is not null or undefined
            assertParamExists('cancel', 'transactionId', transactionId)
            // verify required parameter 'cancelRequest' is not null or undefined
            assertParamExists('cancel', 'cancelRequest', cancelRequest)
            const localVarPath = `/v1/transactions/{transactionId}/cancel`
                .replace(`{${"transactionId"}}`, encodeURIComponent(String(transactionId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(cancelRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Refund requests can be used to credit a transaction which is in status `settled`. The previously settled amount must not be exceeded.
         * @summary Refund a transaction
         * @param {number} transactionId 
         * @param {CreditRequest} creditRequest Credit a transaction
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        credit: async (transactionId: number, creditRequest: CreditRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'transactionId' is not null or undefined
            assertParamExists('credit', 'transactionId', transactionId)
            // verify required parameter 'creditRequest' is not null or undefined
            assertParamExists('credit', 'creditRequest', creditRequest)
            const localVarPath = `/v1/transactions/{transactionId}/credit`
                .replace(`{${"transactionId"}}`, encodeURIComponent(String(transactionId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(creditRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Securely send all the needed parameters to the transaction initialization API. The result of this API call is a `HTTP 201` status code with a `transactionId` in the response body and the `Location` header set. This call is required to proceed with our Redirect and Lightbox integration
         * @summary Initialize a transaction
         * @param {InitRequest} initRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        init: async (initRequest: InitRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'initRequest' is not null or undefined
            assertParamExists('init', 'initRequest', initRequest)
            const localVarPath = `/v1/transactions`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(initRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Check the customer\'s credit score before sending an actual authorization request. No amount will be blocked on the customers account. Currently, only invoicing method `INT` support screening.
         * @summary Screen the customer details
         * @param {ScreenRequest} screenRequest Screen request
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        screen: async (screenRequest: ScreenRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'screenRequest' is not null or undefined
            assertParamExists('screen', 'screenRequest', screenRequest)
            const localVarPath = `/v1/transactions/screen`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(screenRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Proceed with the steps below to process [Secure Fields payment transactions](https://docs.datatrans.ch/docs/integrations-secure-fields):  - Call the /v1/transactions/secureFields endpoint to retrieve a `transactionId`. The success result of this API call is a `HTTP 201` status code with a `transactionId` in the response body. - Initialize the `SecureFields` JavaScript library with the returned `transactionId`: ```js var secureFields = new SecureFields(); secureFields.init(     transactionId, {         cardNumber: \"cardNumberPlaceholder\",         cvv: \"cvvPlaceholder\",     }); ``` - Handle the `success` event of the `secureFields.submit()` call. Example `success` event data: ```json {     \"event\":\"success\",     \"data\": {         \"transactionId\":\"{transactionId}\",         \"cardInfo\":{\"brand\":\"MASTERCARD\",\"type\":\"credit\",\"usage\":\"consumer\",\"country\":\"CH\",\"issuer\":\"DATATRANS\"},         \"redirect\":\"https://pay.sandbox.datatrans.com/upp/v1/3D2/{transactionId}\"     } } ``` - If 3D authentication is required, the `redirect` property will indicate the URL that the browser needs to be redirected to. - Use the [Authorize an authenticated transaction](#operation/authorize-split) endpoint to authorize the Secure Fields transaction. This is required to finalize the authorization process with Secure Fields. - Use the `transactionId` to check the [status](#operation/status) and to [settle](#operation/settle), [cancel](#operation/cancel) or [credit (refund)](#operation/refund) an transaction.
         * @summary Initialize a Secure Fields transaction
         * @param {SecureFieldsInitRequest} secureFieldsInitRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        secureFieldsInit: async (secureFieldsInitRequest: SecureFieldsInitRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'secureFieldsInitRequest' is not null or undefined
            assertParamExists('secureFieldsInit', 'secureFieldsInitRequest', secureFieldsInitRequest)
            const localVarPath = `/v1/transactions/secureFields`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(secureFieldsInitRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Use this API to update the amount of a Secure Fields transaction. This action is only allowed before the 3D process. At least one property must be updated.
         * @summary Update the amount of a Secure Fields transaction
         * @param {number} transactionId 
         * @param {SecureFieldsUpdateRequest} secureFieldsUpdateRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        secureFieldsUpdate: async (transactionId: number, secureFieldsUpdateRequest: SecureFieldsUpdateRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'transactionId' is not null or undefined
            assertParamExists('secureFieldsUpdate', 'transactionId', transactionId)
            // verify required parameter 'secureFieldsUpdateRequest' is not null or undefined
            assertParamExists('secureFieldsUpdate', 'secureFieldsUpdateRequest', secureFieldsUpdateRequest)
            const localVarPath = `/v1/transactions/secureFields/{transactionId}`
                .replace(`{${"transactionId"}}`, encodeURIComponent(String(transactionId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'PATCH', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(secureFieldsUpdateRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * The Settlement request is often also referred to as “Capture” or “Clearing”. It can be used for the settlement of previously authorized transactions. Only after settling a transaction the funds will be credited to your bank accountThe `transactionId` is needed to settle an authorization. This API call is not needed if `autoSettle` was set to `true` when [initializing a transaction](#operation/init).
         * @summary Settle a transaction
         * @param {number} transactionId 
         * @param {SettleRequest} settleRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        settle: async (transactionId: number, settleRequest: SettleRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'transactionId' is not null or undefined
            assertParamExists('settle', 'transactionId', transactionId)
            // verify required parameter 'settleRequest' is not null or undefined
            assertParamExists('settle', 'settleRequest', settleRequest)
            const localVarPath = `/v1/transactions/{transactionId}/settle`
                .replace(`{${"transactionId"}}`, encodeURIComponent(String(transactionId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(settleRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * The API endpoint status can be used to check the status of any transaction, see its history, and retrieve the card information.
         * @summary Checking the status of a transaction
         * @param {number} transactionId 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        status: async (transactionId: number, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'transactionId' is not null or undefined
            assertParamExists('status', 'transactionId', transactionId)
            const localVarPath = `/v1/transactions/{transactionId}`
                .replace(`{${"transactionId"}}`, encodeURIComponent(String(transactionId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * An existing alias can be validated at any time with the transaction validate API. No amount will be blocked on the customers account. Only credit cards (including Apple Pay and Google Pay), `PFC`, `KLN` and `PAP` support validation of an existing alias.
         * @summary Validate an existing alias
         * @param {ValidateRequest} validateRequest Validate an alias
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        validate: async (validateRequest: ValidateRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'validateRequest' is not null or undefined
            assertParamExists('validate', 'validateRequest', validateRequest)
            const localVarPath = `/v1/transactions/validate`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Basic required
            // http basic authentication required
            setBasicAuthToObject(localVarRequestOptions, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(validateRequest, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * V1TransactionsApi - functional programming interface
 * @export
 */
export const V1TransactionsApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = V1TransactionsApiAxiosParamCreator(configuration)
    return {
        /**
         * To create a transaction without user interaction, send all required parameters to our authorize endpoint. This is the API call for merchant-initiated transactions with an existing `alias`. Depending on the payment method, additional parameters will be required. Refer to the payment method specific objects (for example `PAP`) to see which parameters are required additionally send. For credit cards, the `card` object has to be used
         * @summary Authorize a transaction
         * @param {AuthorizeRequest} authorizeRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async authorize(authorizeRequest: AuthorizeRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AuthorizeResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.authorize(authorizeRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Use this API endpoint to fully authorize an already authenticated transaction. This call is required for any transaction done with our Secure Fields or if during the initialization of a transaction the parameter `option.authenticationOnly` was set to `true`
         * @summary Authorize an authenticated transaction
         * @param {number} transactionId 
         * @param {AuthorizeSplitRequest} authorizeSplitRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async authorizeSplit(transactionId: number, authorizeSplitRequest: AuthorizeSplitRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AuthorizeSplitResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.authorizeSplit(transactionId, authorizeSplitRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Cancel requests can be used to release a blocked amount from an authorization. The transaction must either be in status `authorized` or `settled`. The `transactionId` is needed to cancel an authorization
         * @summary Cancel a transaction
         * @param {number} transactionId 
         * @param {CancelRequest} cancelRequest Cancel a transaction
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async cancel(transactionId: number, cancelRequest: CancelRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.cancel(transactionId, cancelRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Refund requests can be used to credit a transaction which is in status `settled`. The previously settled amount must not be exceeded.
         * @summary Refund a transaction
         * @param {number} transactionId 
         * @param {CreditRequest} creditRequest Credit a transaction
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async credit(transactionId: number, creditRequest: CreditRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CreditResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.credit(transactionId, creditRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Securely send all the needed parameters to the transaction initialization API. The result of this API call is a `HTTP 201` status code with a `transactionId` in the response body and the `Location` header set. This call is required to proceed with our Redirect and Lightbox integration
         * @summary Initialize a transaction
         * @param {InitRequest} initRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async init(initRequest: InitRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InitResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.init(initRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Check the customer\'s credit score before sending an actual authorization request. No amount will be blocked on the customers account. Currently, only invoicing method `INT` support screening.
         * @summary Screen the customer details
         * @param {ScreenRequest} screenRequest Screen request
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async screen(screenRequest: ScreenRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AuthorizeResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.screen(screenRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Proceed with the steps below to process [Secure Fields payment transactions](https://docs.datatrans.ch/docs/integrations-secure-fields):  - Call the /v1/transactions/secureFields endpoint to retrieve a `transactionId`. The success result of this API call is a `HTTP 201` status code with a `transactionId` in the response body. - Initialize the `SecureFields` JavaScript library with the returned `transactionId`: ```js var secureFields = new SecureFields(); secureFields.init(     transactionId, {         cardNumber: \"cardNumberPlaceholder\",         cvv: \"cvvPlaceholder\",     }); ``` - Handle the `success` event of the `secureFields.submit()` call. Example `success` event data: ```json {     \"event\":\"success\",     \"data\": {         \"transactionId\":\"{transactionId}\",         \"cardInfo\":{\"brand\":\"MASTERCARD\",\"type\":\"credit\",\"usage\":\"consumer\",\"country\":\"CH\",\"issuer\":\"DATATRANS\"},         \"redirect\":\"https://pay.sandbox.datatrans.com/upp/v1/3D2/{transactionId}\"     } } ``` - If 3D authentication is required, the `redirect` property will indicate the URL that the browser needs to be redirected to. - Use the [Authorize an authenticated transaction](#operation/authorize-split) endpoint to authorize the Secure Fields transaction. This is required to finalize the authorization process with Secure Fields. - Use the `transactionId` to check the [status](#operation/status) and to [settle](#operation/settle), [cancel](#operation/cancel) or [credit (refund)](#operation/refund) an transaction.
         * @summary Initialize a Secure Fields transaction
         * @param {SecureFieldsInitRequest} secureFieldsInitRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async secureFieldsInit(secureFieldsInitRequest: SecureFieldsInitRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<SecureFieldsInitResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.secureFieldsInit(secureFieldsInitRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Use this API to update the amount of a Secure Fields transaction. This action is only allowed before the 3D process. At least one property must be updated.
         * @summary Update the amount of a Secure Fields transaction
         * @param {number} transactionId 
         * @param {SecureFieldsUpdateRequest} secureFieldsUpdateRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async secureFieldsUpdate(transactionId: number, secureFieldsUpdateRequest: SecureFieldsUpdateRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.secureFieldsUpdate(transactionId, secureFieldsUpdateRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * The Settlement request is often also referred to as “Capture” or “Clearing”. It can be used for the settlement of previously authorized transactions. Only after settling a transaction the funds will be credited to your bank accountThe `transactionId` is needed to settle an authorization. This API call is not needed if `autoSettle` was set to `true` when [initializing a transaction](#operation/init).
         * @summary Settle a transaction
         * @param {number} transactionId 
         * @param {SettleRequest} settleRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async settle(transactionId: number, settleRequest: SettleRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.settle(transactionId, settleRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * The API endpoint status can be used to check the status of any transaction, see its history, and retrieve the card information.
         * @summary Checking the status of a transaction
         * @param {number} transactionId 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async status(transactionId: number, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<StatusResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.status(transactionId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * An existing alias can be validated at any time with the transaction validate API. No amount will be blocked on the customers account. Only credit cards (including Apple Pay and Google Pay), `PFC`, `KLN` and `PAP` support validation of an existing alias.
         * @summary Validate an existing alias
         * @param {ValidateRequest} validateRequest Validate an alias
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async validate(validateRequest: ValidateRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AuthorizeResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.validate(validateRequest, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * V1TransactionsApi - factory interface
 * @export
 */
export const V1TransactionsApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = V1TransactionsApiFp(configuration)
    return {
        /**
         * To create a transaction without user interaction, send all required parameters to our authorize endpoint. This is the API call for merchant-initiated transactions with an existing `alias`. Depending on the payment method, additional parameters will be required. Refer to the payment method specific objects (for example `PAP`) to see which parameters are required additionally send. For credit cards, the `card` object has to be used
         * @summary Authorize a transaction
         * @param {AuthorizeRequest} authorizeRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        authorize(authorizeRequest: AuthorizeRequest, options?: any): AxiosPromise<AuthorizeResponse> {
            return localVarFp.authorize(authorizeRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * Use this API endpoint to fully authorize an already authenticated transaction. This call is required for any transaction done with our Secure Fields or if during the initialization of a transaction the parameter `option.authenticationOnly` was set to `true`
         * @summary Authorize an authenticated transaction
         * @param {number} transactionId 
         * @param {AuthorizeSplitRequest} authorizeSplitRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        authorizeSplit(transactionId: number, authorizeSplitRequest: AuthorizeSplitRequest, options?: any): AxiosPromise<AuthorizeSplitResponse> {
            return localVarFp.authorizeSplit(transactionId, authorizeSplitRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * Cancel requests can be used to release a blocked amount from an authorization. The transaction must either be in status `authorized` or `settled`. The `transactionId` is needed to cancel an authorization
         * @summary Cancel a transaction
         * @param {number} transactionId 
         * @param {CancelRequest} cancelRequest Cancel a transaction
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        cancel(transactionId: number, cancelRequest: CancelRequest, options?: any): AxiosPromise<void> {
            return localVarFp.cancel(transactionId, cancelRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * Refund requests can be used to credit a transaction which is in status `settled`. The previously settled amount must not be exceeded.
         * @summary Refund a transaction
         * @param {number} transactionId 
         * @param {CreditRequest} creditRequest Credit a transaction
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        credit(transactionId: number, creditRequest: CreditRequest, options?: any): AxiosPromise<CreditResponse> {
            return localVarFp.credit(transactionId, creditRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * Securely send all the needed parameters to the transaction initialization API. The result of this API call is a `HTTP 201` status code with a `transactionId` in the response body and the `Location` header set. This call is required to proceed with our Redirect and Lightbox integration
         * @summary Initialize a transaction
         * @param {InitRequest} initRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        init(initRequest: InitRequest, options?: any): AxiosPromise<InitResponse> {
            return localVarFp.init(initRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * Check the customer\'s credit score before sending an actual authorization request. No amount will be blocked on the customers account. Currently, only invoicing method `INT` support screening.
         * @summary Screen the customer details
         * @param {ScreenRequest} screenRequest Screen request
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        screen(screenRequest: ScreenRequest, options?: any): AxiosPromise<AuthorizeResponse> {
            return localVarFp.screen(screenRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * Proceed with the steps below to process [Secure Fields payment transactions](https://docs.datatrans.ch/docs/integrations-secure-fields):  - Call the /v1/transactions/secureFields endpoint to retrieve a `transactionId`. The success result of this API call is a `HTTP 201` status code with a `transactionId` in the response body. - Initialize the `SecureFields` JavaScript library with the returned `transactionId`: ```js var secureFields = new SecureFields(); secureFields.init(     transactionId, {         cardNumber: \"cardNumberPlaceholder\",         cvv: \"cvvPlaceholder\",     }); ``` - Handle the `success` event of the `secureFields.submit()` call. Example `success` event data: ```json {     \"event\":\"success\",     \"data\": {         \"transactionId\":\"{transactionId}\",         \"cardInfo\":{\"brand\":\"MASTERCARD\",\"type\":\"credit\",\"usage\":\"consumer\",\"country\":\"CH\",\"issuer\":\"DATATRANS\"},         \"redirect\":\"https://pay.sandbox.datatrans.com/upp/v1/3D2/{transactionId}\"     } } ``` - If 3D authentication is required, the `redirect` property will indicate the URL that the browser needs to be redirected to. - Use the [Authorize an authenticated transaction](#operation/authorize-split) endpoint to authorize the Secure Fields transaction. This is required to finalize the authorization process with Secure Fields. - Use the `transactionId` to check the [status](#operation/status) and to [settle](#operation/settle), [cancel](#operation/cancel) or [credit (refund)](#operation/refund) an transaction.
         * @summary Initialize a Secure Fields transaction
         * @param {SecureFieldsInitRequest} secureFieldsInitRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        secureFieldsInit(secureFieldsInitRequest: SecureFieldsInitRequest, options?: any): AxiosPromise<SecureFieldsInitResponse> {
            return localVarFp.secureFieldsInit(secureFieldsInitRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * Use this API to update the amount of a Secure Fields transaction. This action is only allowed before the 3D process. At least one property must be updated.
         * @summary Update the amount of a Secure Fields transaction
         * @param {number} transactionId 
         * @param {SecureFieldsUpdateRequest} secureFieldsUpdateRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        secureFieldsUpdate(transactionId: number, secureFieldsUpdateRequest: SecureFieldsUpdateRequest, options?: any): AxiosPromise<void> {
            return localVarFp.secureFieldsUpdate(transactionId, secureFieldsUpdateRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * The Settlement request is often also referred to as “Capture” or “Clearing”. It can be used for the settlement of previously authorized transactions. Only after settling a transaction the funds will be credited to your bank accountThe `transactionId` is needed to settle an authorization. This API call is not needed if `autoSettle` was set to `true` when [initializing a transaction](#operation/init).
         * @summary Settle a transaction
         * @param {number} transactionId 
         * @param {SettleRequest} settleRequest 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        settle(transactionId: number, settleRequest: SettleRequest, options?: any): AxiosPromise<void> {
            return localVarFp.settle(transactionId, settleRequest, options).then((request) => request(axios, basePath));
        },
        /**
         * The API endpoint status can be used to check the status of any transaction, see its history, and retrieve the card information.
         * @summary Checking the status of a transaction
         * @param {number} transactionId 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        status(transactionId: number, options?: any): AxiosPromise<StatusResponse> {
            return localVarFp.status(transactionId, options).then((request) => request(axios, basePath));
        },
        /**
         * An existing alias can be validated at any time with the transaction validate API. No amount will be blocked on the customers account. Only credit cards (including Apple Pay and Google Pay), `PFC`, `KLN` and `PAP` support validation of an existing alias.
         * @summary Validate an existing alias
         * @param {ValidateRequest} validateRequest Validate an alias
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        validate(validateRequest: ValidateRequest, options?: any): AxiosPromise<AuthorizeResponse> {
            return localVarFp.validate(validateRequest, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * V1TransactionsApi - object-oriented interface
 * @export
 * @class V1TransactionsApi
 * @extends {BaseAPI}
 */
export class V1TransactionsApi extends BaseAPI {
    /**
     * To create a transaction without user interaction, send all required parameters to our authorize endpoint. This is the API call for merchant-initiated transactions with an existing `alias`. Depending on the payment method, additional parameters will be required. Refer to the payment method specific objects (for example `PAP`) to see which parameters are required additionally send. For credit cards, the `card` object has to be used
     * @summary Authorize a transaction
     * @param {AuthorizeRequest} authorizeRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public authorize(authorizeRequest: AuthorizeRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).authorize(authorizeRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Use this API endpoint to fully authorize an already authenticated transaction. This call is required for any transaction done with our Secure Fields or if during the initialization of a transaction the parameter `option.authenticationOnly` was set to `true`
     * @summary Authorize an authenticated transaction
     * @param {number} transactionId 
     * @param {AuthorizeSplitRequest} authorizeSplitRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public authorizeSplit(transactionId: number, authorizeSplitRequest: AuthorizeSplitRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).authorizeSplit(transactionId, authorizeSplitRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Cancel requests can be used to release a blocked amount from an authorization. The transaction must either be in status `authorized` or `settled`. The `transactionId` is needed to cancel an authorization
     * @summary Cancel a transaction
     * @param {number} transactionId 
     * @param {CancelRequest} cancelRequest Cancel a transaction
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public cancel(transactionId: number, cancelRequest: CancelRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).cancel(transactionId, cancelRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Refund requests can be used to credit a transaction which is in status `settled`. The previously settled amount must not be exceeded.
     * @summary Refund a transaction
     * @param {number} transactionId 
     * @param {CreditRequest} creditRequest Credit a transaction
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public credit(transactionId: number, creditRequest: CreditRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).credit(transactionId, creditRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Securely send all the needed parameters to the transaction initialization API. The result of this API call is a `HTTP 201` status code with a `transactionId` in the response body and the `Location` header set. This call is required to proceed with our Redirect and Lightbox integration
     * @summary Initialize a transaction
     * @param {InitRequest} initRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public init(initRequest: InitRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).init(initRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Check the customer\'s credit score before sending an actual authorization request. No amount will be blocked on the customers account. Currently, only invoicing method `INT` support screening.
     * @summary Screen the customer details
     * @param {ScreenRequest} screenRequest Screen request
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public screen(screenRequest: ScreenRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).screen(screenRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Proceed with the steps below to process [Secure Fields payment transactions](https://docs.datatrans.ch/docs/integrations-secure-fields):  - Call the /v1/transactions/secureFields endpoint to retrieve a `transactionId`. The success result of this API call is a `HTTP 201` status code with a `transactionId` in the response body. - Initialize the `SecureFields` JavaScript library with the returned `transactionId`: ```js var secureFields = new SecureFields(); secureFields.init(     transactionId, {         cardNumber: \"cardNumberPlaceholder\",         cvv: \"cvvPlaceholder\",     }); ``` - Handle the `success` event of the `secureFields.submit()` call. Example `success` event data: ```json {     \"event\":\"success\",     \"data\": {         \"transactionId\":\"{transactionId}\",         \"cardInfo\":{\"brand\":\"MASTERCARD\",\"type\":\"credit\",\"usage\":\"consumer\",\"country\":\"CH\",\"issuer\":\"DATATRANS\"},         \"redirect\":\"https://pay.sandbox.datatrans.com/upp/v1/3D2/{transactionId}\"     } } ``` - If 3D authentication is required, the `redirect` property will indicate the URL that the browser needs to be redirected to. - Use the [Authorize an authenticated transaction](#operation/authorize-split) endpoint to authorize the Secure Fields transaction. This is required to finalize the authorization process with Secure Fields. - Use the `transactionId` to check the [status](#operation/status) and to [settle](#operation/settle), [cancel](#operation/cancel) or [credit (refund)](#operation/refund) an transaction.
     * @summary Initialize a Secure Fields transaction
     * @param {SecureFieldsInitRequest} secureFieldsInitRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public secureFieldsInit(secureFieldsInitRequest: SecureFieldsInitRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).secureFieldsInit(secureFieldsInitRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Use this API to update the amount of a Secure Fields transaction. This action is only allowed before the 3D process. At least one property must be updated.
     * @summary Update the amount of a Secure Fields transaction
     * @param {number} transactionId 
     * @param {SecureFieldsUpdateRequest} secureFieldsUpdateRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public secureFieldsUpdate(transactionId: number, secureFieldsUpdateRequest: SecureFieldsUpdateRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).secureFieldsUpdate(transactionId, secureFieldsUpdateRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * The Settlement request is often also referred to as “Capture” or “Clearing”. It can be used for the settlement of previously authorized transactions. Only after settling a transaction the funds will be credited to your bank accountThe `transactionId` is needed to settle an authorization. This API call is not needed if `autoSettle` was set to `true` when [initializing a transaction](#operation/init).
     * @summary Settle a transaction
     * @param {number} transactionId 
     * @param {SettleRequest} settleRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public settle(transactionId: number, settleRequest: SettleRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).settle(transactionId, settleRequest, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * The API endpoint status can be used to check the status of any transaction, see its history, and retrieve the card information.
     * @summary Checking the status of a transaction
     * @param {number} transactionId 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public status(transactionId: number, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).status(transactionId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * An existing alias can be validated at any time with the transaction validate API. No amount will be blocked on the customers account. Only credit cards (including Apple Pay and Google Pay), `PFC`, `KLN` and `PAP` support validation of an existing alias.
     * @summary Validate an existing alias
     * @param {ValidateRequest} validateRequest Validate an alias
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof V1TransactionsApi
     */
    public validate(validateRequest: ValidateRequest, options?: AxiosRequestConfig) {
        return V1TransactionsApiFp(this.configuration).validate(validateRequest, options).then((request) => request(this.axios, this.basePath));
    }
}


