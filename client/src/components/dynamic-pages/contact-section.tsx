import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Clock, FileText, DollarSign, BookOpen, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertContactMessage } from "@shared/schema";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const { toast } = useToast();

  const contactMutation = useMutation({
    mutationFn: async (data: InsertContactMessage) => {
      return await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "We will get back to you soon.",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
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
                disabled={contactMutation.isPending}
                data-testid="button-submit"
              >
                {contactMutation.isPending ? "Sending..." : "Send Message"}
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
                      Navamukunda HSS Thirunavaya<br />
                      TIRUR Block, Malappuram District<br />
                      Kerala, India
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
                      +91 494 2XX XXXX<br />
                      +91 494 2XX XXXX
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
                      info@navamukunda.edu.in<br />
                      principal@navamukunda.edu.in
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
                      Monday - Friday: 9:00 AM - 4:00 PM<br />
                      Saturday: 9:00 AM - 1:00 PM
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
                  className="flex items-center p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors group"
                  data-testid="link-admission"
                >
                  <FileText className="w-5 h-5 text-primary mr-3" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Gallery</span>
                </a>
                
                <a 
                  href="/about-us" 
                  className="flex items-center p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors group"
                  data-testid="link-fees"
                >
                  <DollarSign className="w-5 h-5 text-primary mr-3" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">About Devs</span>
                </a>
                
                <a 
                  href="/students" 
                  className="flex items-center p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors group"
                  data-testid="link-handbook"
                >
                  <BookOpen className="w-5 h-5 text-primary mr-3" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">Student's Gallery</span>
                </a>
                
                <a 
                  href="/about-teachers" 
                  className="flex items-center p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors group"
                  data-testid="link-calendar"
                >
                  <NotebookPen className="w-5 h-5 text-primary mr-3" />
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
