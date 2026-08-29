"use client";

import { toast } from "sonner";
import { BellIcon, CheckCircle2Icon, CircleAlertIcon, InfoIcon, MenuIcon, SendIcon, TriangleAlertIcon, XCircleIcon } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-3 rounded-xl bg-surface p-5 ring-1 ring-foreground/10"><h3 className="text-lg font-semibold">{title}</h3>{children}</div>;
}

export function ComponentCollectionShowcase() {
  return (
    <section aria-labelledby="component-collection-title" className="space-y-5 pb-10">
      <div>
        <p className="font-label text-sm text-label">Colección reutilizable</p>
        <h2 id="component-collection-title" className="text-2xl font-semibold">15 tipos de componentes configurados</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Section title="Breadcrumb y botones">
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#foundation">Inicio</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Fundación</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
          <div className="flex flex-wrap gap-2"><Button><SendIcon />Principal</Button><Button variant="secondary">Secundario</Button><Button variant="outline">Contorno</Button></div>
        </Section>
        <Card>
          <CardHeader><CardTitle>Card</CardTitle><CardDescription>La superficie elevada utiliza el token surface.</CardDescription></CardHeader>
          <CardContent><Button variant="ghost" size="sm">Acción</Button></CardContent>
        </Card>
        <Section title="Campos de formulario">
          <Field><FieldLabel htmlFor="email">Correo electrónico</FieldLabel><FieldContent><Input id="email" type="email" placeholder="nombre@ejemplo.com" /><FieldDescription>Ejemplo de texto auxiliar accesible.</FieldDescription></FieldContent></Field>
          <div className="flex items-center gap-2"><Checkbox id="terms" /><Label htmlFor="terms">Aceptar las condiciones</Label></div>
          <div className="space-y-2"><Label htmlFor="frequency">Frecuencia</Label><Select items={[{ label: "Semanal", value: "weekly" }, { label: "Mensual", value: "monthly" }]}><SelectTrigger id="frequency" className="w-full"><SelectValue placeholder="Selecciona una opción" /></SelectTrigger><SelectContent><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="monthly">Mensual</SelectItem></SelectContent></Select></div>
        </Section>
        <Section title="Entrada OTP">
          <Label htmlFor="verification-code">Código de verificación</Label>
          <InputOTP id="verification-code" maxLength={6}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup></InputOTP>
        </Section>
        <Section title="Diálogos y confirmación">
          <div className="flex flex-wrap gap-2">
            <Dialog><DialogTrigger render={<Button variant="outline" />}>Abrir diálogo</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Diálogo de ejemplo</DialogTitle><DialogDescription>Una superficie elevada para información complementaria.</DialogDescription></DialogHeader><DialogFooter><Button>Entendido</Button></DialogFooter></DialogContent></Dialog>
            <AlertDialog><AlertDialogTrigger render={<Button variant="outline" />}>Abrir confirmación</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar acción?</AlertDialogTitle><AlertDialogDescription>Este patrón comunica una decisión que requiere confirmación.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            <Sheet><SheetTrigger render={<Button variant="outline" />}><MenuIcon />Abrir panel</SheetTrigger><SheetContent><SheetHeader><SheetTitle>Panel lateral</SheetTitle><SheetDescription>La superficie también se conserva en paneles laterales.</SheetDescription></SheetHeader></SheetContent></Sheet>
          </div>
        </Section>
        <Section title="Carga y notificaciones">
          <div className="flex items-center gap-3"><Skeleton className="h-10 w-24" /><Spinner aria-label="Cargando ejemplo" /><Button variant="outline" onClick={() => toast.success("Notificación de ejemplo enviada") }><BellIcon />Mostrar Sonner</Button></div>
        </Section>
        <Section title="Estados semánticos">
          <ul className="grid gap-2 text-sm"><li className="flex items-center gap-2 text-success"><CheckCircle2Icon aria-hidden="true" />Éxito: cambios guardados</li><li className="flex items-center gap-2 text-info"><InfoIcon aria-hidden="true" />Información disponible</li><li className="flex items-center gap-2 text-warning"><TriangleAlertIcon aria-hidden="true" />Advertencia: revisar datos</li><li className="flex items-center gap-2 text-error"><XCircleIcon aria-hidden="true" />Error: acción no completada</li><li className="sr-only"><CircleAlertIcon />Los estados siempre incluyen texto, no solo color.</li></ul>
        </Section>
      </div>
    </section>
  );
}
