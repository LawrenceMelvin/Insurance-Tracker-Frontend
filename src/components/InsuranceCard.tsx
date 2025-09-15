import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InsuranceCardProps {
  insuranceId?: string;
  insuranceName?: string;
  insuranceType?: string;
  insurancePrice?: number;
  insuranceCoverage?: number;
  insuranceToDate?: string;
  onView?: (insuranceId: string) => void;
  onEdit?: (insuranceId: string) => void;
  onDelete?: (insuranceId: string) => void;
}

const InsuranceCard: React.FC<InsuranceCardProps> = ({
  insuranceId = "1",
  insuranceName = "ABC Insurance",
  insuranceType = "Health",
  insurancePrice = 1200,
  insuranceCoverage = 100000,
  insuranceToDate = "2025-12-31",
  onView = () => {},
  onEdit = () => {},
  onDelete = () => {},
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDelete = () => {
    onDelete(insuranceId);
    setIsDeleteDialogOpen(false);
  };

  // Check if policy is expired
  const isExpired = new Date(insuranceToDate) < new Date();

  const getInsuranceTypeColor = (type: string) => {
    // Capitalize the first letter, lowercase the rest
    const normalizedType =
      type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    const types: Record<string, string> = {
      Health: "bg-green-100 text-green-800",
      Life: "bg-blue-100 text-blue-800",
      Auto: "bg-orange-100 text-orange-800",
      Home: "bg-purple-100 text-purple-800",
      Travel: "bg-yellow-100 text-yellow-800",
    };
    return types[normalizedType] || "bg-gray-100 text-gray-800";
  };

  // Dynamic card styling based on expiration status
  const cardClassName = isExpired 
    ? "w-[350px] h-[220px] bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-2 border-red-500 shadow-red-200"
    : "w-[350px] h-[220px] bg-white shadow-md hover:shadow-lg transition-shadow duration-300";

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{insuranceName}</CardTitle>
          <div className="flex gap-2">
            {isExpired && (
              <Badge className="bg-red-100 text-red-800">
                Expired
              </Badge>
            )}
            <Badge className={`${getInsuranceTypeColor(insuranceType)}`}>
              {insuranceType}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm text-gray-500">
          Coverage: {insuranceCoverage?.toLocaleString() || "N/A"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Premium:</span>
            <span className="text-sm font-bold">
              {insurancePrice.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">Expires:</span>
            <span className={`text-sm ${isExpired ? 'text-red-600 font-semibold' : ''}`}>
              {new Date(insuranceToDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          onClick={() => onView(insuranceId)}
        >
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
          onClick={() => onEdit(insuranceId)}
        >
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the insurance policy from{" "}
                {insuranceName}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default InsuranceCard;