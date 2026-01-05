import { useState } from "react";
import { MapPin, Phone, Mail, Clock, FileText, DollarSign, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InsertContactMessage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import {
  canSubmitMessage,
  getRemainingCooldown,
  formatRemainingTime,
  setLastMessageTime,
} from "@/lib/contact-rate-limit";
// --- CONFIGURATION FOR WEB3FORMS ---
// Ensure VITE_WEB3FORMS_KEY is set in your .env file
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
// ------------------------------------

export default function ContactSection() {
  const [formData, setFormData] = useState<InsertContactMessage>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { playDoneSound, playErrorSound, playHoverSound } = useSound();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit (one message per week)
    if (!canSubmitMessage()) {
      const remaining = getRemainingCooldown();
      const timeLeft = formatRemainingTime(remaining);
      playErrorSound();
      toast({
        title: "Message Limit Reached",
        description: `You can only send one message per week. Please try again in ${timeLeft}.`,
        variant: "destructive",
      });
      return;
    }

    // Check if the key was correctly loaded
    if (!WEB3FORMS_ACCESS_KEY || typeof WEB3FORMS_ACCESS_KEY !== 'string') {
      playErrorSound();
      toast({
        title: "Configuration Error",
        description: "Contact service key is missing. Ensure VITE_WEB3FORMS_KEY is set.",
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
      playErrorSound();
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // --- 1. CONSTRUCT THE PLAIN TEXT MESSAGE WITH SYMBOLS AND SEPARATORS for reliable styling ---

    // The custom introduction text using Plain Text/Emojis for reliable formatting
    const customIntroMessage = `


=====================================================
    ✨ NEW CONTACT FORM MESSAGE RECEIVED ✨
=====================================================

Dear Principal,
A new person has submitted a message in our website with subject being "${formData.subject}".
Below are the details of the submission:

-----------------------------------------------------
👤 FULL NAME: ${formData.firstName} ${formData.lastName}
📧 EMAIL: ${formData.email} (Please Reply To This Email)
📝 SUBJECT: Regarding ${formData.subject}
📞 PHONE: ${formData.phone || "N/A"}
-----------------------------------------------------

MESSAGE BODY:
-----------------------------------------------------
${formData.message}
-----------------------------------------------------

This submission was made on school's website at nhmms.onrender.com by ${formData.firstName} ${formData.lastName}.
`;

    // Prepare data for Web3Forms
    const submissionPayload = {
      // --- Required Web3Forms Fields ---
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `An Enquiry By ${formData.firstName} on school's ${formData.subject} : ${formData.subject}`,

      // --- Custom Introductory Text (This will be the main body of the email) ---
      message_intro: customIntroMessage,

      // --- Honeypot Anti-Spam Field (Web3Forms feature) ---
      "bot-field": "",

      // Removed individual fields like "Full Name", "Email", "Phone", etc.
      // The data is now only present in the message_intro for clean email notifications.
    };

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionPayload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Record submission time for rate limiting
        setLastMessageTime();
        playDoneSound();
        toast({
          title: "Message sent successfully!",
          description: "We will get back to you soon.",
        });
        // Reset form data
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } else {
        // Web3Forms returns errors in the result.message field
        playErrorSound();
        toast({
          title: "Failed to send message",
          description: result.message || "An unknown error occurred. Please check the console.",
          variant: "destructive",
        });
        console.error("Web3Forms Error Details:", result);
      }
    } catch (error: any) {
      playErrorSound();
      toast({
        title: "Network Error",
        description: "Could not connect to the submission service. Check your connection.",
        variant: "destructive",
      });
      console.error("Client-side Fetch Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof InsertContactMessage, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="py-20 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="contact-title">
            Get in Touch
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="contact-subtitle">
            We're here to answer your questions and help you connect with our school community
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-background p-8 rounded-2xl shadow-lg border border-border" data-testid="contact-form-container">
            <h3 className="text-2xl font-bold text-foreground mb-6">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                    First Name *
                  </Label>
                  <Input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    placeholder="Enter your first name"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                    Last Name *
                  </Label>
                  <Input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    placeholder="Enter your last name"
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  placeholder="Enter your email address"
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                  Subject *
                </Label>
                <Select value={formData.subject} onValueChange={(value) => handleInputChange("subject", value)}>
                  <SelectTrigger data-testid="select-subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admission">Admission Inquiry</SelectItem>
                    <SelectItem value="academics">Academic Information</SelectItem>
                    <SelectItem value="facilities">Facilities & Infrastructure</SelectItem>
                    <SelectItem value="events">Events & Activities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  rows={4}
                  required
                  placeholder="Enter your message"
                  data-testid="textarea-message"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* School Information */}
            <div className="bg-background p-8 rounded-2xl shadow-lg border border-border" data-aos="slide-left" data-testid="school-info">
              <h3 className="text-2xl font-bold text-foreground mb-6">School Information</h3>
              <div className="space-y-4">
                <div className="flex items-start" data-testid="school-address">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Address</h4>
                    <p className="text-muted-foreground">
                      Navamukunda HSS<br />
                      Thazhathara, Thirunavaya.676301<br />
                      Malappuram v.Dist
                    </p>
                  </div>
                </div>

                <div className="flex items-start" data-testid="school-phone">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Phone</h4>
                    <p className="text-muted-foreground">
                      +91 0494 260 1534
                    </p>
                  </div>
                </div>

                <div className="flex items-start" data-testid="school-email">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Email</h4>
                    <p className="text-muted-foreground">
                      navamukundahss@gmail.com<br />
                    </p>
                  </div>
                </div>

                <div className="flex items-start" data-testid="office-hours">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Office Hours</h4>
                    <p className="text-muted-foreground">
                      Monday - Friday: 9:00 AM - 4:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-background p-8 rounded-2xl shadow-lg border border-border" data-aos="slide-left" data-aos-delay="200" data-testid="quick-links">
              <h3 className="text-2xl font-bold text-foreground mb-6">Quick Links</h3>
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="/gallery"
                  onMouseEnter={playHoverSound}
                  className="flex items-center p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors group"
                  data-testid="link-admission"
                >
                  <FileText className="w-5 h-5 text-primary mr-3" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Gallery</span>
                </a>

                <a
                  href="/about-us"
                  onMouseEnter={playHoverSound}
                  className="flex items-center p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors group"
                  data-testid="link-fees"
                >
                  <DollarSign className="w-5 h-5 text-primary mr-3" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">About Devs</span>
                </a>

                <a
                  href="/students"
                  onMouseEnter={playHoverSound}
                  className="flex items-center p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors group"
                  data-testid="link-handbook"
                >
                  <BookOpen className="w-5 h-5 text-primary mr-3" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Student's Gallery</span>
                </a>

                <a
                  href="/about-teachers"
                  onMouseEnter={playHoverSound}
                  className="flex items-center p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors group"
                  data-testid="link-calendar"
                >
                  <Calendar className="w-5 h-5 text-primary mr-3" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Our Teacher's</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
