import { inngest } from "@/src/inngest/client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Improved Email templates with personalization
export const EMAIL_TEMPLATES = {
  SAFARI_BOOKING: {
    subject: "Safari Booking Requirements - Ranthambore Regency",
    template: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Safari Booking Requirements - Ranthambore Regency</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #f4f1e8 0%, #e8dcc0 50%, #f0e6d2 100%); line-height: 1.6; min-height: 100vh;">
        <div style="max-width: 620px; margin: 40px auto; padding: 20px;">
            
            <!-- Main Container with Natural Glass Effect -->
            <div style="background: rgba(255, 251, 245, 0.9); backdrop-filter: blur(20px); border-radius: 24px; box-shadow: 0 8px 32px rgba(101, 67, 33, 0.08), 0 0 0 1px rgba(255, 251, 245, 0.3); overflow: hidden;">
                
                <!-- Header with Wildlife Colors -->
                <div style="background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(160, 82, 45, 0.15) 100%); padding: 40px 40px 30px 40px; text-align: center; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.3;"></div>
                    <h1 style="color: #654321; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 1px; position: relative; z-index: 1;">
                        RANTHAMBORE REGENCY
                    </h1>
                    <div style="height: 2px; width: 60px; background: linear-gradient(90deg, #d2691e, #8b4513); margin: 12px auto; border-radius: 1px; opacity: 0.8;"></div>
                    <p style="color: #8b6914; margin: 8px 0 0 0; font-size: 13px; font-weight: 400; position: relative; z-index: 1; opacity: 0.9;">
                        🐅 Safari Booking • Wildlife Sanctuary Experience
                    </p>
                </div>
                
                <!-- Content -->
                <div style="padding: 35px 40px 40px 40px;">
                    
                    <!-- Greeting -->
                    <div style="margin-bottom: 24px;">
                        <h2 style="color: #5d4037; font-size: 18px; font-weight: 400; margin: 0;">
                            Dear Sir,
                        </h2>
                    </div>
                    
                    <!-- Introduction -->
                    <div style="margin-bottom: 28px;">
                        <p style="color: #6d4c41; margin: 0; font-size: 15px; font-weight: 400; line-height: 1.7;">
                            Thank you for choosing <span style="color: #d2691e; font-weight: 500;">Ranthambore Regency</span> for your guests' stay. We are delighted to have the opportunity to host them and ensure a comfortable and memorable experience.
                        </p>
                    </div>
                    
                    <!-- Safari Booking Request with Warm Orange Accent -->
                    <div style="background: linear-gradient(135deg, rgba(210, 105, 30, 0.08) 0%, rgba(184, 134, 11, 0.12) 100%); border: 1px solid rgba(210, 105, 30, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 28px;">
                        <p style="color: #6d4c41; margin: 0 0 16px 0; font-size: 15px; line-height: 1.7;">
                            If the safari is to be arranged through us, we kindly request you to share the <span style="color: #d2691e; font-weight: 500;">booking requirements</span> at your earliest convenience, provided you have received the necessary details.
                        </p>
                        <p style="color: #6d4c41; margin: 0; font-size: 15px; line-height: 1.7;">
                            We will be happy to assist with all arrangements.
                        </p>
                    </div>
                    
                    <!-- Additional Message -->
                    <div style="background: rgba(222, 184, 135, 0.3); backdrop-filter: blur(6px); border: 1px solid rgba(210, 180, 140, 0.4); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                        <p style="color: #6d4c41; margin: 0; font-size: 14px; line-height: 1.6; text-align: center;">
                            Looking forward to hearing from you soon.
                        </p>
                    </div>
                    
                    <!-- Call to Action with Tiger-Inspired Colors -->
                    <div style="text-align: center; margin: 32px 0 28px 0;">
                        <div style="background: linear-gradient(135deg, #d2691e 0%, #a0522d 100%); color: white; padding: 14px 28px; border-radius: 50px; display: inline-block; font-size: 14px; font-weight: 500; box-shadow: 0 8px 25px rgba(210, 105, 30, 0.25); backdrop-filter: blur(10px);">
                            We look forward to hosting your guests
                        </div>
                    </div>
                    
                    <!-- Signature -->
                    <div style="border-top: 1px solid rgba(139, 69, 19, 0.15); padding-top: 24px; margin-top: 28px;">
                        <p style="color: #8d6e63; font-size: 15px; font-weight: 400; margin: 0 0 4px 0;">
                            Warm regards,
                        </p>
                        <p style="color: #5d4037; font-size: 15px; font-weight: 500; margin: 0 0 20px 0;">
                            Team Ranthambore Regency
                        </p>
                        
                        <!-- Contact Information with Nature-Inspired Background -->
                        <div style="background: rgba(245, 222, 179, 0.3); backdrop-filter: blur(8px); border-radius: 12px; padding: 18px; border: 1px solid rgba(210, 180, 140, 0.3);">
                            <div style="display: grid; gap: 6px; font-size: 13px;">
                                <div style="display: flex; align-items: center; color: #6d4c41;">
                                    <span style="margin-right: 8px; opacity: 0.8;">🌐</span>
                                    <a href="https://www.ranthamboreregency.com" style="color: #d2691e; text-decoration: none; font-weight: 400;">www.ranthamboreregency.com</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Subtle Footer with Wildlife Theme -->
            <div style="text-align: center; padding: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #a0522d; opacity: 0.7;">
                    🐅 Wild Adventures • 🦌 Natural Hospitality • 🌿 Unforgettable Memories
                </p>
            </div>
        </div>
    </body>
    </html>`,
  },
  RECONFIRMATION_VOUCHER: {
    subject: "Reconfirmation Voucher Required - Ranthambore Regency",
    template: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reconfirmation Voucher Required - Ranthambore Regency</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #f4f1e8 0%, #e8dcc0 50%, #f0e6d2 100%); line-height: 1.6; min-height: 100vh;">
        <div style="max-width: 620px; margin: 40px auto; padding: 20px;">
            
            <!-- Main Container with Natural Glass Effect -->
            <div style="background: rgba(255, 251, 245, 0.9); backdrop-filter: blur(20px); border-radius: 24px; box-shadow: 0 8px 32px rgba(101, 67, 33, 0.08), 0 0 0 1px rgba(255, 251, 245, 0.3); overflow: hidden;">
                
                <!-- Header with Wildlife Colors -->
                <div style="background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(160, 82, 45, 0.15) 100%); padding: 40px 40px 30px 40px; text-align: center; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.3;"></div>
                    <h1 style="color: #654321; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 1px; position: relative; z-index: 1;">
                        RANTHAMBORE REGENCY
                    </h1>
                    <div style="height: 2px; width: 60px; background: linear-gradient(90deg, #d2691e, #8b4513); margin: 12px auto; border-radius: 1px; opacity: 0.8;"></div>
                    <p style="color: #8b6914; margin: 8px 0 0 0; font-size: 13px; font-weight: 400; position: relative; z-index: 1; opacity: 0.9;">
                        📋 Reconfirmation Required • Wildlife Sanctuary Experience
                    </p>
                </div>
                
                <!-- Content -->
                <div style="padding: 35px 40px 40px 40px;">
                    
                    <!-- Greeting -->
                    <div style="margin-bottom: 24px;">
                        <h2 style="color: #5d4037; font-size: 18px; font-weight: 400; margin: 0;">
                            Dear {{agent_name}},
                        </h2>
                    </div>
                    
                    <!-- Introduction -->
                    <div style="margin-bottom: 28px;">
                        <p style="color: #6d4c41; margin: 0; font-size: 15px; font-weight: 400; line-height: 1.7;">
                            Thank you for choosing <span style="color: #d2691e; font-weight: 500;">Ranthambore Regency</span> for your guests' stay. We are delighted to have the opportunity to host them and ensure a comfortable and memorable experience.
                        </p>
                    </div>
                    
                    <!-- Booking Details with Earthy Tones -->
                    <div style="background: rgba(245, 222, 179, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(210, 180, 140, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 16px rgba(139, 69, 19, 0.06);">
                        <h3 style="color: #5d4037; font-size: 16px; font-weight: 500; margin: 0 0 18px 0; display: flex; align-items: center;">
                            <span style="background: linear-gradient(135deg, #cd853f, #a0522d); width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px;">
                                <span style="color: white; font-size: 10px;">🦌</span>
                            </span>
                            Booking Details
                        </h3>
                        <div style="display: grid; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                <span style="color: #8d6e63; font-weight: 400; font-size: 14px;">Guest Name</span>
                                <span style="color: #5d4037; font-weight: 500; font-size: 14px;">{{client_name}}</span>
                            </div>
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 69, 19, 0.2), transparent);"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                <span style="color: #8d6e63; font-weight: 400; font-size: 14px;">Check-in</span>
                                <span style="color: #5d4037; font-weight: 500; font-size: 14px;">{{check_in_date}}</span>
                            </div>
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 69, 19, 0.2), transparent);"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                <span style="color: #8d6e63; font-weight: 400; font-size: 14px;">Check-out</span>
                                <span style="color: #5d4037; font-weight: 500; font-size: 14px;">{{check_out_date}}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Reconfirmation Request with Warm Orange Accent -->
                    <div style="background: linear-gradient(135deg, rgba(210, 105, 30, 0.08) 0%, rgba(184, 134, 11, 0.12) 100%); border: 1px solid rgba(210, 105, 30, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 28px;">
                        <p style="color: #6d4c41; margin: 0 0 16px 0; font-size: 15px; line-height: 1.7;">
                            We kindly request you to share the <span style="color: #d2691e; font-weight: 500;">reconfirmation voucher</span> at your earliest convenience.
                        </p>
                        <p style="color: #6d4c41; margin: 0; font-size: 15px; line-height: 1.7;">
                            If you have already received the necessary details, please do let us know.
                        </p>
                    </div>
                    
                    <!-- Additional Message -->
                    <div style="background: rgba(222, 184, 135, 0.3); backdrop-filter: blur(6px); border: 1px solid rgba(210, 180, 140, 0.4); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                        <p style="color: #6d4c41; margin: 0; font-size: 14px; line-height: 1.6; text-align: center;">
                            Looking forward to your response.
                        </p>
                    </div>
                    
                    <!-- Call to Action with Tiger-Inspired Colors -->
                    <div style="text-align: center; margin: 32px 0 28px 0;">
                        <div style="background: linear-gradient(135deg, #d2691e 0%, #a0522d 100%); color: white; padding: 14px 28px; border-radius: 50px; display: inline-block; font-size: 14px; font-weight: 500; box-shadow: 0 8px 25px rgba(210, 105, 30, 0.25); backdrop-filter: blur(10px);">
                            We look forward to hosting your guests
                        </div>
                    </div>
                    
                    <!-- Signature -->
                    <div style="border-top: 1px solid rgba(139, 69, 19, 0.15); padding-top: 24px; margin-top: 28px;">
                        <p style="color: #8d6e63; font-size: 15px; font-weight: 400; margin: 0 0 4px 0;">
                            Warm regards,
                        </p>
                        <p style="color: #5d4037; font-size: 15px; font-weight: 500; margin: 0 0 20px 0;">
                            Team Ranthambore Regency
                        </p>
                        
                        <!-- Contact Information with Nature-Inspired Background -->
                        <div style="background: rgba(245, 222, 179, 0.3); backdrop-filter: blur(8px); border-radius: 12px; padding: 18px; border: 1px solid rgba(210, 180, 140, 0.3);">
                            <div style="display: grid; gap: 6px; font-size: 13px;">
                                <div style="display: flex; align-items: center; color: #6d4c41;">
                                    <span style="margin-right: 8px; opacity: 0.8;">📧</span>
                                    <a href="mailto:reservations@ranthamboreregency.com" style="color: #d2691e; text-decoration: none; font-weight: 400;">reservations@ranthamboreregency.com</a>
                                </div>
                                <div style="display: flex; align-items: center; color: #6d4c41;">
                                    <span style="margin-right: 8px; opacity: 0.8;">🌐</span>
                                    <a href="https://www.ranthamboreregency.com" style="color: #d2691e; text-decoration: none; font-weight: 400;">www.ranthamboreregency.com</a>
                                </div>
                                <div style="display: flex; align-items: center; color: #6d4c41;">
                                    <span style="margin-right: 8px; opacity: 0.8;">📞</span>
                                    <span style="font-weight: 400;">+91-XXXXXXXXXX</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Subtle Footer with Wildlife Theme -->
            <div style="text-align: center; padding: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #a0522d; opacity: 0.7;">
                    🐅 Wild Adventures • 🦌 Natural Hospitality • 🌿 Unforgettable Memories
                </p>
            </div>
        </div>
    </body>
    </html>`,
  },
  ADVANCE_PAYMENT: {
    subject: "Advance Payment Details Required - Ranthambore Regency",
    template: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Advance Payment Details Required - Ranthambore Regency</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #f4f1e8 0%, #e8dcc0 50%, #f0e6d2 100%); line-height: 1.6; min-height: 100vh;">
        <div style="max-width: 620px; margin: 40px auto; padding: 20px;">
            
            <!-- Main Container with Natural Glass Effect -->
            <div style="background: rgba(255, 251, 245, 0.9); backdrop-filter: blur(20px); border-radius: 24px; box-shadow: 0 8px 32px rgba(101, 67, 33, 0.08), 0 0 0 1px rgba(255, 251, 245, 0.3); overflow: hidden;">
                
                <!-- Header with Wildlife Colors -->
                <div style="background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(160, 82, 45, 0.15) 100%); padding: 40px 40px 30px 40px; text-align: center; position: relative;">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.3;"></div>
                    <h1 style="color: #654321; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 1px; position: relative; z-index: 1;">
                        RANTHAMBORE REGENCY
                    </h1>
                    <div style="height: 2px; width: 60px; background: linear-gradient(90deg, #d2691e, #8b4513); margin: 12px auto; border-radius: 1px; opacity: 0.8;"></div>
                    <p style="color: #8b6914; margin: 8px 0 0 0; font-size: 13px; font-weight: 400; position: relative; z-index: 1; opacity: 0.9;">
                        🐅 Wildlife Sanctuary Experience • Secure Reservation
                    </p>
                </div>
                
                <!-- Content -->
                <div style="padding: 35px 40px 40px 40px;">
                    
                    <!-- Greeting -->
                    <div style="margin-bottom: 24px;">
                        <h2 style="color: #5d4037; font-size: 18px; font-weight: 400; margin: 0;">
                            Dear {{agent_name}},
                        </h2>
                    </div>
                    
                    <!-- Introduction -->
                    <div style="margin-bottom: 28px;">
                        <p style="color: #6d4c41; margin: 0; font-size: 15px; font-weight: 400; line-height: 1.7;">
                            Thank you for choosing <span style="color: #d2691e; font-weight: 500;">Ranthambore Regency</span> for your guests' stay. We are delighted to have the opportunity to host them and ensure a comfortable experience.
                        </p>
                    </div>
                    
                    <!-- Booking Details with Earthy Tones -->
                    <div style="background: rgba(245, 222, 179, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(210, 180, 140, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 16px rgba(139, 69, 19, 0.06);">
                        <h3 style="color: #5d4037; font-size: 16px; font-weight: 500; margin: 0 0 18px 0; display: flex; align-items: center;">
                            <span style="background: linear-gradient(135deg, #cd853f, #a0522d); width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px;">
                                <span style="color: white; font-size: 10px;">🦌</span>
                            </span>
                            Booking Details
                        </h3>
                        <div style="display: grid; gap: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                <span style="color: #8d6e63; font-weight: 400; font-size: 14px;">Guest Name</span>
                                <span style="color: #5d4037; font-weight: 500; font-size: 14px;">{{client_name}}</span>
                            </div>
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 69, 19, 0.2), transparent);"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                <span style="color: #8d6e63; font-weight: 400; font-size: 14px;">Check-in</span>
                                <span style="color: #5d4037; font-weight: 500; font-size: 14px;">{{check_in_date}}</span>
                            </div>
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 69, 19, 0.2), transparent);"></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                                <span style="color: #8d6e63; font-weight: 400; font-size: 14px;">Check-out</span>
                                <span style="color: #5d4037; font-weight: 500; font-size: 14px;">{{check_out_date}}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment Request with Forest Green -->
                    <div style="background: linear-gradient(135deg, rgba(85, 107, 47, 0.08) 0%, rgba(107, 142, 35, 0.12) 100%); border: 1px solid rgba(85, 107, 47, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 28px;">
                        <p style="color: #6d4c41; margin: 0; font-size: 15px; line-height: 1.7;">
                            We kindly request you to share the <span style="color: #556b2f; font-weight: 500;">advance payment details</span> at your earliest convenience.
                        </p>
                    </div>
                    
                    <!-- Additional Support with Warm Earth Tones -->
                    <div style="background: rgba(222, 184, 135, 0.3); backdrop-filter: blur(6px); border: 1px solid rgba(210, 180, 140, 0.4); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                        <p style="color: #6d4c41; margin: 0; font-size: 14px; line-height: 1.6; text-align: center;">
                            If you require any further information please do let us know.
                        </p>
                    </div>
                    
                    <!-- Call to Action with Tiger-Inspired Colors -->
                    <div style="text-align: center; margin: 32px 0 28px 0;">
                        <div style="background: linear-gradient(135deg, #d2691e 0%, #a0522d 100%); color: white; padding: 14px 28px; border-radius: 50px; display: inline-block; font-size: 14px; font-weight: 500; box-shadow: 0 8px 25px rgba(210, 105, 30, 0.25); backdrop-filter: blur(10px);">
                            We look forward to hearing from you soon
                        </div>
                    </div>
                    
                    <!-- Signature -->
                    <div style="border-top: 1px solid rgba(139, 69, 19, 0.15); padding-top: 24px; margin-top: 28px;">
                        <p style="color: #8d6e63; font-size: 15px; font-weight: 400; margin: 0 0 4px 0;">
                            Warm regards,
                        </p>
                        <p style="color: #5d4037; font-size: 15px; font-weight: 500; margin: 0 0 20px 0;">
                            Team Ranthambore Regency
                        </p>
                        
                        <!-- Contact Information with Nature-Inspired Background -->
                        <div style="background: rgba(245, 222, 179, 0.3); backdrop-filter: blur(8px); border-radius: 12px; padding: 18px; border: 1px solid rgba(210, 180, 140, 0.3);">
                            <div style="display: grid; gap: 6px; font-size: 13px;">
                                <div style="display: flex; align-items: center; color: #6d4c41;">
                                    <span style="margin-right: 8px; opacity: 0.8;">📧</span>
                                    <a href="mailto:reservations@ranthamboreregency.com" style="color: #d2691e; text-decoration: none; font-weight: 400;">reservations@ranthamboreregency.com</a>
                                </div>
                                <div style="display: flex; align-items: center; color: #6d4c41;">
                                    <span style="margin-right: 8px; opacity: 0.8;">🌐</span>
                                    <a href="https://www.ranthamboreregency.com" style="color: #d2691e; text-decoration: none; font-weight: 400;">www.ranthamboreregency.com</a>
                                </div>
                                <div style="display: flex; align-items: center; color: #6d4c41;">
                                    <span style="margin-right: 8px; opacity: 0.8;">📞</span>
                                    <span style="font-weight: 400;">+91-XXXXXXXXXX</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Subtle Footer with Wildlife Theme -->
            <div style="text-align: center; padding: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #a0522d; opacity: 0.7;">
                    🐅 Wild Adventures • 🦌 Natural Hospitality • 🌿 Unforgettable Memories
                </p>
            </div>
        </div>
    </body>
    </html>`,
  },
};

// Utility function to format dates
function formatDate(dateString) {
  if (!dateString) return "";
  let date;
  if (typeof dateString === "string" && dateString.includes("/")) {
    const [day, month, year] = dateString.split("/");
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateString);
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Calculate scheduling dates based on check-in date
export function calculateSchedulingDates(fromDate) {
  // Parse date properly - handle DD/MM/YYYY format
  let checkInDate;
  if (typeof fromDate === "string" && fromDate.includes("/")) {
    // Handle DD/MM/YYYY format
    const [day, month, year] = fromDate.split("/");
    checkInDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  } else {
    checkInDate = new Date(fromDate);
  }

  const currentDate = new Date();

  // Validate the checkInDate
  if (isNaN(checkInDate.getTime())) {
    console.error("Invalid check-in date:", fromDate);
    return [];
  }

  // Calculate days difference
  const daysDifference = Math.ceil(
    (checkInDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  console.log({ daysDifference, checkInDate, currentDate });

  const schedules = [];

  if (daysDifference >= 100) {
    // Full schedule: 100, 45, 30 days before check-in
    schedules.push({
      type: "SAFARI_BOOKING",
      daysBeforeCheckIn: 100,
      scheduledDate: new Date(
        checkInDate.getTime() - 100 * 24 * 60 * 60 * 1000
      ),
    });

    schedules.push({
      type: "RECONFIRMATION_VOUCHER",
      daysBeforeCheckIn: 45,
      scheduledDate: new Date(checkInDate.getTime() - 45 * 24 * 60 * 60 * 1000),
    });

    schedules.push({
      type: "ADVANCE_PAYMENT",
      daysBeforeCheckIn: 30,
      scheduledDate: new Date(checkInDate.getTime() - 30 * 24 * 60 * 60 * 1000),
    });
  } else if (daysDifference > 0) {
    // Proportional schedule based on available days
    const ratio = daysDifference / 100;

    const firstEmailDays = Math.floor(100 * ratio); // Safari booking (earliest)
    const secondEmailDays = Math.floor(45 * ratio); // Voucher reconfirmation
    const thirdEmailDays = Math.floor(30 * ratio); // Advance payment (latest)

    // Add first email (Safari booking) if it's at least 1 day before
    if (firstEmailDays > 0) {
      schedules.push({
        type: "SAFARI_BOOKING",
        daysBeforeCheckIn: firstEmailDays,
        scheduledDate: new Date(
          checkInDate.getTime() - firstEmailDays * 24 * 60 * 60 * 1000
        ),
      });
    }

    // Add second email (Voucher reconfirmation) if it's different from first and at least 1 day before
    if (secondEmailDays > 0) {
      schedules.push({
        type: "RECONFIRMATION_VOUCHER",
        daysBeforeCheckIn: secondEmailDays,
        scheduledDate: new Date(
          checkInDate.getTime() - secondEmailDays * 24 * 60 * 60 * 1000
        ),
      });
    }

    // Add third email (Advance payment) if it's different from previous emails and at least 1 day before
    if (thirdEmailDays > 0) {
      schedules.push({
        type: "ADVANCE_PAYMENT",
        daysBeforeCheckIn: thirdEmailDays,
        scheduledDate: new Date(
          checkInDate.getTime() - thirdEmailDays * 24 * 60 * 60 * 1000
        ),
      });
    }
  }

  // Filter out schedules that are in the past and validate dates
  // return schedules.filter((schedule) => {
  //   const isValidDate = !isNaN(schedule.scheduledDate.getTime());
  //   const isFuture = schedule.scheduledDate > currentDate;
  //   const isAfter1980 =
  //     schedule.scheduledDate.getTime() > new Date("1980-01-01").getTime();

  //   if (!isValidDate) {
  //     console.error(
  //       "Invalid scheduled date for",
  //       schedule.type,
  //       schedule.scheduledDate
  //     );
  //   }
  //   if (!isAfter1980) {
  //     console.error(
  //       "Scheduled date before 1980 for",
  //       schedule.type,
  //       schedule.scheduledDate
  //     );
  //   }

  //   return isValidDate && isFuture && isAfter1980;
  // });
  return schedules;
}

// Schedule multiple emails for a booking using hybrid approach
export async function scheduleBookingEmails(recipientEmail, bookingDetails) {
  try {
    // Get scheduling dates
    const schedules = calculateSchedulingDates(bookingDetails.fromDate);

    console.log({ schedules });


    if (schedules.length === 0) {
      return {
        success: false,
        error:
          "No emails to schedule - check-in date may be too soon or invalid",
        schedules: [],
      };
    }

    // Process emails that need to be scheduled with Inngest (>30 days)
      console.log(
        `⏰ Scheduling ${schedules.length} emails via Inngest...`
      );
    const results = [];

      for (const schedule of schedules) {
        const template = EMAIL_TEMPLATES[schedule.type];
        if (!template) {
          console.warn(`⚠️ Unknown email template: ${schedule.type}`);
          continue;
        }

        try {
          // Validate the scheduled date
          if (isNaN(schedule.scheduledDate.getTime())) {
            throw new Error(
              `Invalid scheduled date: ${schedule.scheduledDate}`
            );
          }
          const scheduledTime = schedule.scheduledDate.getTime(); 

          await inngest.send({
            name: "email/schedule",
            data: {
              recipientEmail,
              bookingDetails,
              emailType: schedule.type,
              daysBeforeCheckIn: schedule.daysBeforeCheckIn,
              template: {
                subject: template.subject,
                html: template.template,
              },
              scheduledDate: schedule.scheduledDate.toISOString(),
            },
            ts: scheduledTime, // Use validated seconds-based timestamp
          });

          console.log(`✅ Email scheduled via Inngest:`, {
            type: schedule.type,
            scheduledFor: schedule.scheduledDate.toISOString(),
            timestamp: scheduledTime,
          });

          results.push({
            emailType: schedule.type,
            scheduledDate: schedule.scheduledDate.toISOString(),
            daysBeforeCheckIn: schedule.daysBeforeCheckIn,
            status: "scheduled_via_inngest",
            method: "inngest",
          });
        } catch (error) {
          console.error(
            `❌ Error scheduling email via Inngest for ${schedule.type}:`,
            error
          );
          results.push({
            emailType: schedule.type,
            scheduledDate: schedule.scheduledDate.toISOString(),
            daysBeforeCheckIn: schedule.daysBeforeCheckIn,
            status: "failed",
            error: error.message,
            method: "inngest",
          });
        }
      }

    const successCount = results.filter((r) =>
      r.status.includes("scheduled")
    ).length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return {
      success: successCount > 0,
      scheduledEmails: results,
      totalEmails: results.length,
      successCount,
      failedCount,
      message: `Email scheduling completed: ${successCount} scheduled, ${failedCount} failed`,
    };
  } catch (error) {
    console.error("💥 Error in scheduleBookingEmails:", error);
    return {
      success: false,
      error: error.message || "Failed to schedule emails",
      schedules: [],
    };
  }
}
